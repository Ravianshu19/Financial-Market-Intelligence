#!/usr/bin/env python3
"""
Quantra MLOps Drift Check — Population Stability Index (PSI) calculator.
Computes covariate shift between baseline training data and live data distributions.
"""
import sys
import numpy as np
import pandas as pd
import yfinance as yf

# Re-use backend ML feature engineering if possible
try:
    from backend.ml import build_features, FEATURES
except ImportError:
    # Inline features build if run standalone
    FEATURES = ["ret_1", "vol_10", "rsi_14", "sma_ratio_20_50"]
    def build_features(df):
        df = df.copy()
        c = df["Close"]
        df["ret_1"] = np.log(c / c.shift(1))
        df["vol_10"] = df["ret_1"].rolling(10).std()
        df["rsi_14"] = 50.0  # Simple placeholder
        df["sma_ratio_20_50"] = c.rolling(20).mean() / c.rolling(50).mean()
        return df

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_bins: int = 10) -> float:
    """Calculate Population Stability Index (PSI) between expected and actual distributions."""
    # Remove NaNs
    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0
        
    # Get bin edges from expected dataset
    percentiles = np.linspace(0, 100, num_bins + 1)
    bin_edges = np.percentile(expected, percentiles)
    
    # Adjust boundaries to prevent out-of-bounds
    bin_edges[0] -= 1e-5
    bin_edges[-1] += 1e-5
    
    # Calculate counts in bins
    expected_counts, _ = np.histogram(expected, bins=bin_edges)
    actual_counts, _ = np.histogram(actual, bins=bin_edges)
    
    # Convert to percentages
    expected_pcts = expected_counts / len(expected)
    actual_pcts = actual_counts / len(actual)
    
    # Handle zero counts by replacing with a very small number (smoothing)
    expected_pcts = np.where(expected_pcts == 0, 1e-4, expected_pcts)
    actual_pcts = np.where(actual_pcts == 0, 1e-4, actual_pcts)
    
    # Calculate PSI
    psi_value = np.sum((actual_pcts - expected_pcts) * np.log(actual_pcts / expected_pcts))
    return float(psi_value)

def run_drift_check(ticker: str = "NVDA") -> dict:
    """Run drift check by comparing 6-month historical window with recent 1-month window."""
    ticker = ticker.upper()
    print(f"Running MLOps Feature Drift Check for {ticker} ...")
    
    # Fetch historical data
    t = yf.Ticker(ticker)
    df = t.history(period="1y", interval="1d", auto_adjust=False)
    if len(df) < 100:
        print("Error: insufficient stock history to run drift check.")
        return {}
        
    df = build_features(df).dropna()
    
    # Split into baseline (older 9 months) and target (recent 3 months)
    split_idx = int(len(df) * 0.75)
    baseline_df = df.iloc[:split_idx]
    target_df = df.iloc[split_idx:]
    
    report = {}
    print("\n--- Population Stability Index (PSI) Report ---")
    for feat in FEATURES:
        if feat not in df.columns:
            continue
        psi_val = calculate_psi(baseline_df[feat].values, target_df[feat].values)
        
        status = "HEALTHY"
        if psi_val >= 0.25:
            status = "ACTION REQUIRED (HIGH DRIFT)"
        elif psi_val >= 0.1:
            status = "WARNING (MODERATE DRIFT)"
            
        report[feat] = {
            "psi": round(psi_val, 4),
            "status": status
        }
        print(f"Feature: {feat:<20} | PSI: {psi_val:.4f} | Status: {status}")
        
    max_psi = max(r["psi"] for r in report.values()) if report else 0.0
    print(f"\nOverall Pipeline Status: {'DRIFT ALERT' if max_psi >= 0.25 else 'HEALTHY'}")
    return report

if __name__ == "__main__":
    ticker_arg = sys.argv[1] if len(sys.argv) > 1 else "NVDA"
    run_drift_check(ticker_arg)

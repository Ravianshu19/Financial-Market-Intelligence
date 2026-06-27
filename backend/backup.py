import os
import shutil
import sqlite3
from datetime import datetime

def perform_backup():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "quantra.db")
    backup_dir = os.path.join(os.path.dirname(base_dir), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, f"quantra_backup_{timestamp}.db")
    
    if not os.path.exists(db_path):
        print(f"No database file found at {db_path} to backup.")
        return
        
    print(f"Starting online database backup from {db_path} to {backup_path}...")
    try:
        # Perform safe SQLite online backup
        src_conn = sqlite3.connect(db_path)
        dst_conn = sqlite3.connect(backup_path)
        with dst_conn:
            src_conn.backup(dst_conn)
        src_conn.close()
        dst_conn.close()
        print(f"Database backup completed successfully: {backup_path}")
    except Exception as e:
        print(f"Online backup failed: {e}. Falling back to file copy...")
        try:
            shutil.copy2(db_path, backup_path)
            print(f"File copy backup completed successfully: {backup_path}")
        except Exception as copy_err:
            print(f"File copy backup also failed: {copy_err}")

if __name__ == "__main__":
    perform_backup()

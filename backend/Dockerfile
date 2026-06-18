FROM python:3.9-slim

WORKDIR /app

# Install system dependencies (build-essential, libomp for xgboost on linux)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libomp-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . ./backend

EXPOSE 8000

# Set PYTHONPATH so python knows where backend is
ENV PYTHONPATH=/app

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

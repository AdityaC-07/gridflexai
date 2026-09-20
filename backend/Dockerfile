FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY shared ./shared
COPY forecast_service ./forecast_service
COPY grid_intelligence ./grid_intelligence
COPY optimization_service ./optimization_service
COPY data_api ./data_api
COPY verification_service ./verification_service
COPY copilot_service ./copilot_service
COPY reliability_metrics.py ./reliability_metrics.py
COPY app ./app
COPY tests ./tests

# Expose the application port
EXPOSE 8000

# Set environment variables for local mode
ENV APP_MODE=local
ENV FEEDER_ID=F01
ENV AWS_REGION=ap-south-1

# Run the unified application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

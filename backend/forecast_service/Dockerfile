FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./requirements.txt
COPY forecast_service/requirements.txt ./forecast_service/requirements.txt
RUN pip install --no-cache-dir -r forecast_service/requirements.txt
COPY shared ./shared
COPY forecast_service ./forecast_service
EXPOSE 8000
CMD ["uvicorn", "forecast_service.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.11-slim
WORKDIR /app
COPY optimization_service/requirements.txt ./optimization_service/requirements.txt
RUN pip install --no-cache-dir -r optimization_service/requirements.txt
COPY shared ./shared
COPY forecast_service ./forecast_service
COPY grid_intelligence ./grid_intelligence
COPY optimization_service ./optimization_service
EXPOSE 8000
CMD ["uvicorn", "optimization_service.main:app", "--host", "0.0.0.0", "--port", "8000"]

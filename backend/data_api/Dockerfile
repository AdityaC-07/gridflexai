FROM python:3.11-slim
WORKDIR /app
COPY data_api/requirements.txt ./data_api/requirements.txt
RUN pip install --no-cache-dir -r data_api/requirements.txt
RUN pip install --no-cache-dir scikit-learn==1.4.0 pandas==2.1.0 numpy==1.26.0 scipy==1.11.0
COPY shared ./shared
COPY forecast_service ./forecast_service
COPY grid_intelligence ./grid_intelligence
COPY optimization_service ./optimization_service
COPY data_api ./data_api
COPY reliability_metrics.py ./reliability_metrics.py
EXPOSE 8000
CMD ["uvicorn", "data_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

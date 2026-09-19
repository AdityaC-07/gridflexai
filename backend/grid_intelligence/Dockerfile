FROM python:3.11-slim
WORKDIR /app
COPY grid_intelligence/requirements.txt ./grid_intelligence/requirements.txt
RUN pip install --no-cache-dir -r grid_intelligence/requirements.txt
COPY shared ./shared
COPY forecast_service ./forecast_service
COPY grid_intelligence ./grid_intelligence
EXPOSE 8000
CMD ["uvicorn", "grid_intelligence.main:app", "--host", "0.0.0.0", "--port", "8000"]


FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
FROM base AS development
RUN pip install --no-cache-dir watchfiles
COPY app ./app
CMD ["watchfiles", "--filter", "python", "python -m app.main", "/app/app"]
FROM base AS production
COPY app ./app
CMD ["python", "-m", "app.main"]

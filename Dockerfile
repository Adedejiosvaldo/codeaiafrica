# The Akada Labs app: React site + FastAPI API + the browser lab (JupyterLite), in one image.

# 1. The website
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. The browser lab (weeks 2-5 notebooks), served at /lab/
FROM python:3.12-slim AS lab
WORKDIR /lab
COPY lab/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY lab/ ./
RUN jupyter lite build --contents content --output-dir /lab-site

# 3. The app
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 ENV=production \
    DATABASE_URL=sqlite:////data/akada.db FRONTEND_DIST=/app/frontend/dist
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=web /web/dist /app/frontend/dist
COPY --from=lab /lab-site /app/frontend/dist/lab
RUN useradd --create-home --uid 1000 akada && mkdir -p /data && chown akada /data
USER akada
VOLUME /data
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=4)"
# Run migrations, then serve. Caddy sits in front, so trust its forwarded client IP.
CMD ["sh", "-c", "python -m app.cli migrate && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]

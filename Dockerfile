# Stage 1: Frontend bauen
FROM node:20 AS frontend-builder
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
# Immer neu bauen für frische Assets
RUN npm run build

# Stage 2: Python runtime
FROM python:3.11-slim
WORKDIR /app

# Optional native libs (falls gebraucht)
RUN apt-get update && apt-get install -y build-essential gcc libssl-dev libffi-dev && rm -rf /var/lib/apt/lists/*

# App-Code kopieren
COPY . .

# Frontend-Build übernehmen (verwende lokales Build)
COPY frontend/build ./frontend/build

# Python dependencies
RUN pip install --upgrade pip
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Azure-Port
ENV PORT=8000
ENV WEBSITES_PORT=8000

# Starten mit Gunicorn (Wrapper app.py erwartet app:app)
CMD ["sh", "-c", "gunicorn app:app --workers 4 --bind=0.0.0.0:${WEBSITES_PORT:-${PORT:-8000}} --log-level info"] 
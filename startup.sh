#!/bin/bash
echo "🚀 Starting Zeiterfassung App on Azure..."
gunicorn app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120 
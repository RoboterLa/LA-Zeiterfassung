#!/bin/bash

# Build script for Azure App Service
echo "🚀 Starting build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p sessions
mkdir -p instance

# Set permissions
echo "🔐 Setting permissions..."
chmod +x startup.txt

# Create database if it doesn't exist
echo "🗄️  Initializing database..."
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database initialized successfully')
"

echo "✅ Build completed successfully!" 
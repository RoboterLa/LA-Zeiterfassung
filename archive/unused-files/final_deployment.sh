#!/bin/bash

echo "🚀 Final Deployment Script"
echo "=========================="

# 1. Test all components
echo "1. Testing all components..."
python3 test_user_management.py
python3 test_time_tracking.py
python3 test_security_monitoring.py

# 2. Build frontend
echo "2. Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. Package application
echo "3. Packaging application..."
zip -r app.zip app.py backend/ requirements.txt static/ >/dev/null

# 4. Deploy to Azure
echo "4. Deploying to Azure..."
az webapp deployment source config-zip \
  --resource-group la-zeiterfassung-rg \
  --name la-zeiterfassung-fyd4cge3d9e3cac4 \
  --src app.zip

# 5. Health check
echo "5. Health check..."
sleep 10
curl -s https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/health | head -5

echo "✅ Deployment complete!"
echo "📊 System Status:"
echo "  - URL: https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net"
echo "  - Health: /health"
echo "  - Demo Users: admin@test.com / admin123"

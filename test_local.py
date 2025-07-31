#!/usr/bin/env python3
"""
Lokaler Test für Azure App Service Deployment
"""

import os
import subprocess
import time
import requests

def test_local():
    """Teste die App lokal"""
    print("🧪 Lokaler Test für Azure Deployment")
    print("====================================")
    
    # Starte Flask App
    print("🚀 Starte Flask App...")
    process = subprocess.Popen(['python3', 'app.py'], 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE)
    
    # Warte kurz
    time.sleep(3)
    
    try:
        # Teste Health Check
        print("🔍 Teste Health Check...")
        response = requests.get('http://localhost:80/health')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Teste API Status
        print("📊 Teste API Status...")
        response = requests.get('http://localhost:80/api/status')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Teste Frontend
        print("🌐 Teste Frontend...")
        response = requests.get('http://localhost:80/')
        print(f"Status: {response.status_code}")
        
        print("✅ Lokaler Test erfolgreich!")
        
    except requests.exceptions.ConnectionError:
        print("❌ App nicht erreichbar - Port 80 belegt?")
    except Exception as e:
        print(f"❌ Test fehlgeschlagen: {e}")
    finally:
        # Stoppe App
        process.terminate()
        process.wait()

if __name__ == '__main__':
    test_local() 
#!/usr/bin/env python3
"""
Test Script für RBAC System
"""

import requests
import json

BASE_URL = 'http://localhost:5002'

def test_rbac_system():
    """Testet das RBAC System"""
    print("🧪 Teste RBAC System...")
    
    # Test 1: Dev Login
    print("\n1. Teste Dev Login...")
    try:
        response = requests.get(f"{BASE_URL}/dev_login", allow_redirects=False)
        print(f"   Status: {response.status_code}")
        if response.status_code == 302:
            print("   ✅ Dev Login erfolgreich - Weiterleitung erwartet")
        else:
            print(f"   ⚠️  Unerwarteter Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Fehler: {e}")
    
    # Test 2: Geschützte Route ohne Login
    print("\n2. Teste geschützte Route ohne Login...")
    try:
        response = requests.get(f"{BASE_URL}/approve_entries", allow_redirects=False)
        print(f"   Status: {response.status_code}")
        if response.status_code == 302:
            print("   ✅ Weiterleitung zu Login erwartet")
        else:
            print(f"   ⚠️  Unerwarteter Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Fehler: {e}")
    
    # Test 3: Admin Route ohne Login
    print("\n3. Teste Admin Route ohne Login...")
    try:
        response = requests.get(f"{BASE_URL}/admin/users", allow_redirects=False)
        print(f"   Status: {response.status_code}")
        if response.status_code == 302:
            print("   ✅ Weiterleitung zu Login erwartet")
        else:
            print(f"   ⚠️  Unerwarteter Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Fehler: {e}")
    
    # Test 4: Öffentliche Route
    print("\n4. Teste öffentliche Route...")
    try:
        response = requests.get(f"{BASE_URL}/", allow_redirects=False)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Öffentliche Route erreichbar")
        else:
            print(f"   ⚠️  Unerwarteter Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Fehler: {e}")
    
    print("\n✅ RBAC Tests abgeschlossen!")

if __name__ == "__main__":
    test_rbac_system() 
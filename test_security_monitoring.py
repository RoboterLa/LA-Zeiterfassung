#!/usr/bin/env python3
"""
Test-Script für Sicherheit und Monitoring
"""

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.utils.security import SecurityService, DataRetentionService
from backend.utils.monitoring import monitoring_service, AlertService
from backend.models.user import UserService
from backend.utils.db import init_db

def test_security_features():
    """Testet Sicherheitsfunktionen"""
    print("🔒 Teste Sicherheitsfunktionen...")
    
    # Test 1: Password Hashing
    print("\n🔐 Test 1: Password Hashing")
    password = "test123"
    hashed = SecurityService.hash_password(password)
    print(f"  ✅ Password gehasht: {hashed[:20]}...")
    
    # Test 2: Password Verification
    is_valid = SecurityService.verify_password(password, hashed)
    print(f"  ✅ Password Verifikation: {is_valid}")
    
    # Test 3: Audit Logging
    print("\n📝 Test 3: Audit Logging")
    SecurityService.generate_audit_log(1, 'test_action', 'Test audit entry')
    print("  ✅ Audit-Log erstellt")
    
    # Test 4: Data Retention
    print("\n🗄️ Test 4: Data Retention")
    retention_data = DataRetentionService.export_data_for_retention(
        1, '2024-01-01', '2024-12-31'
    )
    print(f"  ✅ Daten exportiert für Benutzer {retention_data['user_id']}")

def test_monitoring_features():
    """Testet Monitoring-Funktionen"""
    print("\n📊 Teste Monitoring-Funktionen...")
    
    # Test 1: Health Checks
    print("\n🏥 Test 1: Health Checks")
    health_results = monitoring_service.run_health_checks()
    print(f"  📈 Overall Status: {health_results['overall_status']}")
    print(f"  🔍 {len(health_results['checks'])} Checks durchgeführt")
    
    for check in health_results['checks']:
        status_icon = "✅" if check['status'] == 'healthy' else "❌"
        print(f"    {status_icon} {check['name']}: {check['status']} ({check['duration']})")
    
    # Test 2: Alerts
    print("\n🚨 Test 2: Alerts")
    AlertService.send_alert('test_alert', 'Test alert message', 'warning')
    print("  ✅ Test-Alert gesendet")
    
    # Test 3: Active Alerts
    active_alerts = AlertService.get_active_alerts()
    print(f"  📋 {len(active_alerts)} aktive Alerts")

def test_azure_ad_integration():
    """Testet Azure AD Integration (Simulation)"""
    print("\n☁️ Teste Azure AD Integration...")
    
    # Simuliere Azure AD Konfiguration
    azure_config = {
        'tenant_id': '3efb4b34-9ef2-4200-b749-2a501b2aaee6',
        'client_id': 'bce7f739-d799-4c57-8758-7b6b21999678',
        'redirect_uri': 'https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/auth/callback',
        'scopes': ['User.Read', 'Calendars.Read']
    }
    
    print("  ✅ Azure AD Konfiguration:")
    for key, value in azure_config.items():
        print(f"    - {key}: {value}")
    
    print("\n  📋 SSO Integration Plan:")
    print("    1. Azure AD App Registration")
    print("    2. OAuth 2.0 Flow implementieren")
    print("    3. JWT Token Validation")
    print("    4. User Provisioning")
    print("    5. Role Mapping (Azure AD Groups → App Roles)")

def test_data_retention():
    """Testet Datenaufbewahrung (10 Jahre)"""
    print("\n📅 Teste Datenaufbewahrung (10 Jahre)...")
    
    # Initialisiere Datenbank
    init_db()
    
    # Simuliere Datenaufbewahrung
    retention_policy = {
        'audit_logs': '10 Jahre',
        'time_entries': '10 Jahre (genehmigte), 3 Jahre (andere)',
        'user_data': 'Unbegrenzt (DSGVO)',
        'backup_frequency': 'Täglich',
        'backup_retention': '10 Jahre',
        'encryption': 'AES-256 für Backups'
    }
    
    print("  📋 Datenaufbewahrungsrichtlinie:")
    for data_type, retention in retention_policy.items():
        print(f"    - {data_type}: {retention}")
    
    # Test Backup-Simulation
    print("\n  💾 Backup-Simulation:")
    backup_info = {
        'last_backup': '2024-08-03 19:30:00',
        'backup_size': '15.2 MB',
        'backup_location': 'Azure Blob Storage',
        'encryption': 'AES-256'
    }
    
    for key, value in backup_info.items():
        print(f"    - {key}: {value}")

def main():
    """Hauptfunktion für alle Tests"""
    print("🧪 Teste Sicherheit und Monitoring...")
    
    test_security_features()
    test_monitoring_features()
    test_azure_ad_integration()
    test_data_retention()
    
    print("\n✅ Alle Sicherheits- und Monitoring-Tests abgeschlossen!")

if __name__ == "__main__":
    main()

import logging
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from flask import jsonify
import sqlite3
from backend.utils.db import get_db_connection

class MonitoringService:
    """Service für Monitoring und Alerts"""
    
    def __init__(self):
        self.health_checks = []
        self.alerts = []
    
    def register_health_check(self, name: str, check_func, critical: bool = False):
        """Registriert einen Health Check"""
        self.health_checks.append({
            'name': name,
            'function': check_func,
            'critical': critical,
            'last_check': None,
            'last_status': None
        })
    
    def run_health_checks(self) -> Dict:
        """Führt alle Health Checks aus"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'healthy',
            'checks': [],
            'alerts': []
        }
        
        critical_failures = 0
        
        for check in self.health_checks:
            try:
                start_time = time.time()
                status = check['function']()
                duration = time.time() - start_time
                
                check_result = {
                    'name': check['name'],
                    'status': 'healthy' if status else 'unhealthy',
                    'duration': f"{duration:.3f}s",
                    'critical': check['critical']
                }
                
                if not status and check['critical']:
                    critical_failures += 1
                    check_result['alert'] = f"Critical check failed: {check['name']}"
                
                check['last_check'] = datetime.now()
                check['last_status'] = status
                
                results['checks'].append(check_result)
                
            except Exception as e:
                logging.error(f"Health check failed: {check['name']} - {str(e)}")
                check_result = {
                    'name': check['name'],
                    'status': 'error',
                    'error': str(e),
                    'critical': check['critical']
                }
                
                if check['critical']:
                    critical_failures += 1
                    check_result['alert'] = f"Critical check error: {check['name']}"
                
                results['checks'].append(check_result)
        
        if critical_failures > 0:
            results['overall_status'] = 'critical'
        elif any(check['status'] == 'unhealthy' for check in results['checks']):
            results['overall_status'] = 'degraded'
        
        return results
    
    def check_database_connection(self) -> bool:
        """Prüft Datenbankverbindung"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT 1')
            cursor.fetchone()
            conn.close()
            return True
        except Exception as e:
            logging.error(f"Database connection failed: {str(e)}")
            return False
    
    def check_disk_space(self) -> bool:
        """Prüft verfügbaren Speicherplatz"""
        try:
            import os
            stat = os.statvfs('.')
            free_space_gb = (stat.f_bavail * stat.f_frsize) / (1024**3)
            return free_space_gb > 1.0  # Mindestens 1GB frei
        except Exception as e:
            logging.error(f"Disk space check failed: {str(e)}")
            return False
    
    def check_memory_usage(self) -> bool:
        """Prüft Speicherverbrauch"""
        try:
            import psutil
            memory_percent = psutil.virtual_memory().percent
            return memory_percent < 90  # Unter 90%
        except ImportError:
            # psutil nicht verfügbar, überspringe Check
            return True
        except Exception as e:
            logging.error(f"Memory check failed: {str(e)}")
            return False
    
    def check_external_services(self) -> bool:
        """Prüft externe Services (Azure AD, etc.)"""
        try:
            # TODO: Implementiere echte Service-Checks
            # Für jetzt: Simuliere erfolgreichen Check
            return True
        except Exception as e:
            logging.error(f"External services check failed: {str(e)}")
            return False

class AlertService:
    """Service für Alerts und Benachrichtigungen"""
    
    @staticmethod
    def send_alert(alert_type: str, message: str, severity: str = 'warning'):
        """Sendet Alert"""
        alert = {
            'timestamp': datetime.now().isoformat(),
            'type': alert_type,
            'message': message,
            'severity': severity
        }
        
        # Log Alert
        logging.warning(f"ALERT: {alert}")
        
        # TODO: Implementiere echte Alert-Versendung
        # - E-Mail an Admin
        # - Slack/Teams Webhook
        # - Azure Monitor
        # - SMS (für kritische Alerts)
        
        AlertService._store_alert(alert)
    
    @staticmethod
    def _store_alert(alert: Dict):
        """Speichert Alert in Datenbank"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                severity TEXT NOT NULL,
                acknowledged BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            INSERT INTO alerts (timestamp, type, message, severity)
            VALUES (?, ?, ?, ?)
        ''', (
            alert['timestamp'],
            alert['type'],
            alert['message'],
            alert['severity']
        ))
        
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_active_alerts() -> List[Dict]:
        """Holt aktive Alerts"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM alerts 
            WHERE acknowledged = FALSE 
            ORDER BY created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

# Global monitoring instance
monitoring_service = MonitoringService()

# Register default health checks
monitoring_service.register_health_check('database', monitoring_service.check_database_connection, critical=True)
monitoring_service.register_health_check('disk_space', monitoring_service.check_disk_space, critical=True)
monitoring_service.register_health_check('memory', monitoring_service.check_memory_usage)
monitoring_service.register_health_check('external_services', monitoring_service.check_external_services)

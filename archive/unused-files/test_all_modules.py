#!/usr/bin/env python3
"""
Test-Script für alle neuen Module
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.models.buero_time_tracking import BueroTimeTrackingService
from backend.models.daily_reports import DailyReportService
from backend.models.vacation_management import VacationService
from backend.models.order_management import OrderService
from backend.models.reports_exports import ReportService
from backend.models.user import UserService
from backend.utils.db import init_db

def test_all_modules():
    """Testet alle neuen Module"""
    print("🧪 Teste alle neuen Module...")
    
    # Initialisiere Datenbank
    init_db()
    
    # Erstelle Demo-Benutzer
    users = UserService.create_demo_users()
    buero_user = UserService.get_user_by_email("buero@test.com")
    monteur_user = UserService.get_user_by_email("monteur1@test.com")
    meister_user = UserService.get_user_by_email("meister@test.com")
    
    print(f"👥 {len(users)} Demo-Benutzer erstellt")
    
    # Test 1: Büroangestellte Time Tracking
    print("\n🏢 Test 1: Büroangestellte Time Tracking")
    
    # Einstempeln
    result = BueroTimeTrackingService.clock_in_office(buero_user.id, "Hauptbüro")
    print(f"  ✅ Büro-Einstempeln: {result['message']}")
    
    # Ausstempeln (simuliere 9h Arbeit)
    result = BueroTimeTrackingService.clock_out_office(buero_user.id, "Arbeit beendet")
    print(f"  ✅ Büro-Ausstempeln: {result['message']}")
    if 'warning' in result:
        print(f"  ⚠️  {result['warning']}")
    
    # Monatsübersicht
    summary = BueroTimeTrackingService.get_monthly_summary(buero_user.id, 2024, 8)
    print(f"  📊 Monatsübersicht: {summary['total_hours']}h, {summary['work_days']} Tage")
    
    # Test 2: Daily Reports & Premium Pay
    print("\n📝 Test 2: Daily Reports & Premium Pay")
    
    # Tagesbericht erstellen
    result = DailyReportService.create_daily_report(
        monteur_user.id, "2024-08-03", 
        "Aufzug Wartung und Reparatur", 8.5, 
        "Ersatzteile: 2x Seile, 1x Motor", 
        "Keine Probleme"
    )
    print(f"  ✅ Tagesbericht erstellt: {result['message']}")
    
    # Ausstehende Berichte
    pending = DailyReportService.get_pending_reports()
    print(f"  📋 {len(pending)} ausstehende Berichte")
    
    # Prämienlohn berechnen
    premium_pay = DailyReportService.calculate_premium_pay(monteur_user.id, 8, 2024)
    print(f"  💰 Prämienlohn: {premium_pay['total_pay']} €")
    
    # Test 3: Vacation Management
    print("\n🏖️ Test 3: Vacation Management")
    
    # Verfügbare Urlaubstage
    available = VacationService.get_available_days(monteur_user.id, 2024)
    print(f"  �� Verfügbare Urlaubstage: {available['vacation_days']}")
    print(f"  📅 Verfügbare Krankheitstage: {available['sick_days']}")
    
    # Urlaubsantrag erstellen
    result = VacationService.create_vacation_request(
        monteur_user.id, "2024-09-15", "2024-09-20", 
        "Urlaub", "Sommerurlaub"
    )
    print(f"  ✅ Urlaubsantrag erstellt: {result['message']}")
    
    # Ausstehende Anträge
    pending_vacation = VacationService.get_pending_requests()
    print(f"  📋 {len(pending_vacation)} ausstehende Urlaubsanträge")
    
    # Test 4: Order Management
    print("\n📋 Test 4: Order Management")
    
    # Auftrag erstellen
    result = OrderService.create_order(
        "Aufzug Wartung", "09:00", "Musterstraße 123, 12345 Stadt",
        "52.5200,13.4050", "Regelmäßige Wartung", "high"
    )
    print(f"  ✅ Auftrag erstellt: {result['message']}")
    
    # Auftrag zuweisen
    result = OrderService.assign_order_to_employee(result['order_id'], "Max Monteur")
    print(f"  ✅ Auftrag zugewiesen: {result['message']}")
    
    # Alle Aufträge
    orders = OrderService.get_all_orders()
    print(f"  📋 {len(orders)} Aufträge insgesamt")
    
    # Auftrags-Statistiken
    stats = OrderService.get_order_statistics()
    print(f"  📊 Offene Aufträge: {stats['open_orders']}")
    print(f"  📊 Abschlussrate: {stats['completion_rate']}")
    
    # Test 5: Reports & Exports
    print("\n📊 Test 5: Reports & Exports")
    
    # Monatsbericht
    monthly_report = ReportService.generate_monthly_report(2024, 8)
    print(f"  📈 Monatsbericht: {monthly_report['total_hours']}h, {monthly_report['employee_count']} Mitarbeiter")
    
    # Prämienlohn-Bericht
    premium_report = ReportService.calculate_premium_pay_report(2024, 8)
    print(f"  💰 Prämienlohn-Bericht: {premium_report['total_premium_pay']:.2f} €")
    
    # Management-Dashboard
    dashboard = ReportService.generate_management_dashboard()
    print(f"  📊 Dashboard: {dashboard['active_employees']} aktive Mitarbeiter")
    print(f"  📊 Dashboard: {dashboard['open_orders']} offene Aufträge")
    
    print("\n✅ Alle Module erfolgreich getestet!")

if __name__ == "__main__":
    test_all_modules()

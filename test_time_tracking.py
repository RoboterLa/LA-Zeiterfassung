#!/usr/bin/env python3
"""
Test-Script für Monteur-Zeiterfassung
"""

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.models.user import UserService
from backend.models.time_tracking import TimeTrackingService
from backend.utils.db import init_db

def test_monteur_time_tracking():
    """Testet die Monteur-Zeiterfassung"""
    print("�� Teste Monteur-Zeiterfassung...")
    
    # Initialisiere Datenbank
    init_db()
    
    # Erstelle Demo-Benutzer
    users = UserService.create_demo_users()
    monteur = UserService.get_user_by_email("monteur1@test.com")
    
    if not monteur:
        print("❌ Monteur nicht gefunden")
        return
    
    print(f"👷 Teste mit Monteur: {monteur.name}")
    
    # Test 1: Einstempeln
    print("\n⏰ Test 1: Einstempeln")
    result = TimeTrackingService.clock_in(monteur.id, "Baustelle A")
    print(f"  {result['message']}")
    
    # Test 2: Aktiven Eintrag abrufen
    print("\n📋 Test 2: Aktiver Eintrag")
    active = TimeTrackingService.get_active_entry(monteur.id)
    if active:
        print(f"  ✅ Aktiv seit: {active['start_time']}")
    
    # Test 3: Heutige Einträge
    print("\n📊 Test 3: Heutige Einträge")
    entries = TimeTrackingService.get_today_entries(monteur.id)
    print(f"  📝 {len(entries)} Einträge heute")
    
    # Test 4: Arbeitszeit-Zusammenfassung
    print("\n📈 Test 4: Arbeitszeit-Zusammenfassung")
    summary = TimeTrackingService.calculate_work_summary(monteur.id)
    print(f"  ⏱️  Status: {summary['status']}")
    print(f"  📊 Einträge: {summary['entries_count']}")
    
    # Test 5: Ausstempeln (simuliere 9h Arbeit)
    print("\n⏰ Test 5: Ausstempeln (9h simuliert)")
    # Simuliere längere Arbeitszeit
    result = TimeTrackingService.clock_out(monteur.id, "Arbeit beendet")
    print(f"  {result['message']}")
    if 'warning' in result:
        print(f"  ⚠️  {result['warning']}")
    if 'overtime_hours' in result and result['overtime_hours']:
        print(f"  💰 Überstunden: {result['overtime_hours']}h")
    
    # Test 6: Überstundenantrag
    print("\n📝 Test 6: Überstundenantrag")
    entries = TimeTrackingService.get_today_entries(monteur.id)
    if entries:
        last_entry = entries[-1]
        overtime_result = TimeTrackingService.request_overtime(
            last_entry['id'], 
            "Wichtiger Auftrag musste fertiggestellt werden"
        )
        print(f"  {overtime_result['message']}")
    
    # Test 7: Ausstehende Überstundenanträge (als Meister)
    print("\n👨‍💼 Test 7: Ausstehende Überstundenanträge")
    pending = TimeTrackingService.get_pending_overtime_requests()
    print(f"  📋 {len(pending)} ausstehende Anträge")
    
    for request in pending:
        print(f"    - {request['user_name']}: {request['total_hours']}h")
    
    # Test 8: Überstunden genehmigen (als Meister)
    if pending:
        print("\n✅ Test 8: Überstunden genehmigen")
        approval_result = TimeTrackingService.approve_overtime(
            pending[0]['id'], 
            True, 
            1, 
            "Genehmigt - Wichtiger Auftrag"
        )
        print(f"  {approval_result['message']}")
    
    print("\n✅ Monteur-Zeiterfassung Test abgeschlossen!")

if __name__ == "__main__":
    test_monteur_time_tracking()

#!/usr/bin/env python3
"""
Robustes CSV-Handling für Zeiterfassung System
Thread-safe mit Error-Handling und Logging
"""

import os
import csv
import json
import logging
import threading
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thread-Lock für CSV-Operationen
csv_lock = threading.Lock()

class CSVManager:
    """Thread-sicherer CSV-Manager mit Error-Handling"""
    
    def __init__(self, filename: str, fieldnames: List[str] = None):
        self.filename = filename
        self.fieldnames = fieldnames
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
    
    def _create_backup(self) -> str:
        """Erstellt ein Backup der aktuellen Datei"""
        if not os.path.exists(self.filename):
            return None
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"{self.filename}.backup.{timestamp}"
        backup_path = self.backup_dir / backup_name
        
        try:
            import shutil
            shutil.copy2(self.filename, backup_path)
            logger.info(f"💾 Backup erstellt: {backup_path}")
            return str(backup_path)
        except Exception as e:
            logger.error(f"❌ Backup-Fehler: {e}")
            return None
    
    def read_csv(self) -> List[Dict[str, Any]]:
        """Liest CSV-Datei thread-safe"""
        with csv_lock:
            try:
                if not os.path.exists(self.filename):
                    logger.warning(f"⚠️  Datei existiert nicht: {self.filename}")
                    return []
                
                with open(self.filename, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    data = list(reader)
                    logger.debug(f"📖 {len(data)} Zeilen aus {self.filename} gelesen")
                    return data
                    
            except Exception as e:
                logger.error(f"❌ Fehler beim Lesen von {self.filename}: {e}")
                return []
    
    def write_csv(self, data: List[Dict[str, Any]], create_backup: bool = True) -> bool:
        """Schreibt CSV-Datei thread-safe mit optionalem Backup"""
        with csv_lock:
            try:
                # Backup erstellen
                if create_backup and os.path.exists(self.filename):
                    self._create_backup()
                
                # Daten schreiben
                with open(self.filename, 'w', newline='', encoding='utf-8') as f:
                    if data and self.fieldnames:
                        writer = csv.DictWriter(f, fieldnames=self.fieldnames)
                        writer.writeheader()
                        writer.writerows(data)
                    elif data:
                        # Automatisch Fieldnames aus erstem Datensatz ableiten
                        fieldnames = list(data[0].keys())
                        writer = csv.DictWriter(f, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerows(data)
                    else:
                        # Leere Datei mit Header erstellen
                        if self.fieldnames:
                            writer = csv.DictWriter(f, fieldnames=self.fieldnames)
                            writer.writeheader()
                
                logger.info(f"✅ {len(data)} Zeilen in {self.filename} geschrieben")
                return True
                
            except Exception as e:
                logger.error(f"❌ Fehler beim Schreiben in {self.filename}: {e}")
                return False
    
    def append_row(self, row: Dict[str, Any]) -> bool:
        """Fügt eine Zeile zur CSV-Datei hinzu"""
        with csv_lock:
            try:
                # Bestehende Daten lesen
                existing_data = self.read_csv()
                
                # Neue Zeile hinzufügen
                existing_data.append(row)
                
                # Zurückschreiben
                return self.write_csv(existing_data, create_backup=False)
                
            except Exception as e:
                logger.error(f"❌ Fehler beim Hinzufügen zu {self.filename}: {e}")
                return False
    
    def update_row(self, id_field: str, id_value: Any, updates: Dict[str, Any]) -> bool:
        """Aktualisiert eine Zeile basierend auf ID"""
        with csv_lock:
            try:
                data = self.read_csv()
                
                # Zeile finden und aktualisieren
                for row in data:
                    if str(row.get(id_field)) == str(id_value):
                        row.update(updates)
                        logger.info(f"✅ Zeile {id_value} in {self.filename} aktualisiert")
                        return self.write_csv(data, create_backup=False)
                
                logger.warning(f"⚠️  Zeile {id_value} in {self.filename} nicht gefunden")
                return False
                
            except Exception as e:
                logger.error(f"❌ Fehler beim Aktualisieren von {self.filename}: {e}")
                return False
    
    def delete_row(self, id_field: str, id_value: Any) -> bool:
        """Löscht eine Zeile basierend auf ID"""
        with csv_lock:
            try:
                data = self.read_csv()
                
                # Zeile finden und entfernen
                original_length = len(data)
                data = [row for row in data if str(row.get(id_field)) != str(id_value)]
                
                if len(data) < original_length:
                    logger.info(f"✅ Zeile {id_value} aus {self.filename} gelöscht")
                    return self.write_csv(data, create_backup=False)
                else:
                    logger.warning(f"⚠️  Zeile {id_value} in {self.filename} nicht gefunden")
                    return False
                    
            except Exception as e:
                logger.error(f"❌ Fehler beim Löschen aus {self.filename}: {e}")
                return False

# Spezielle CSV-Manager für verschiedene Datentypen
class ZeiterfassungCSV(CSVManager):
    """CSV-Manager für Zeiterfassung-Daten"""
    
    def __init__(self):
        super().__init__('zeiterfassung.csv', [
            'id', 'elevator_id', 'location', 'date', 'activity_type', 
            'other_activity', 'start_time', 'end_time', 'emergency_week', 
            'notes', 'status', 'mitarbeiter', 'comment', 'history'
        ])
    
    def add_entry(self, entry: Dict[str, Any]) -> bool:
        """Fügt einen neuen Zeiterfassung-Eintrag hinzu"""
        # ID generieren falls nicht vorhanden
        if 'id' not in entry:
            entry['id'] = str(len(self.read_csv()) + 1)
        
        # Timestamp für History
        if 'history' not in entry:
            entry['history'] = json.dumps([{
                'timestamp': datetime.now().isoformat(),
                'action': 'erstellt',
                'comment': ''
            }])
        
        return self.append_row(entry)
    
    def update_status(self, entry_id: str, new_status: str, comment: str = "") -> bool:
        """Aktualisiert den Status eines Eintrags"""
        # History erweitern
        history_entry = {
            'timestamp': datetime.now().isoformat(),
            'action': new_status,
            'comment': comment
        }
        
        return self.update_row('id', entry_id, {
            'status': new_status,
            'history': json.dumps([history_entry])
        })

class AuftraegeCSV(CSVManager):
    """CSV-Manager für Auftrags-Daten"""
    
    def __init__(self):
        super().__init__('auftraege.csv', [
            'id', 'art', 'uhrzeit', 'standort', 'coords', 'details', 'done'
        ])
    
    def add_auftrag(self, auftrag: Dict[str, Any]) -> bool:
        """Fügt einen neuen Auftrag hinzu"""
        if 'id' not in auftrag:
            auftrag['id'] = str(len(self.read_csv()) + 1)
        
        return self.append_row(auftrag)
    
    def mark_done(self, auftrag_id: str) -> bool:
        """Markiert einen Auftrag als erledigt"""
        return self.update_row('id', auftrag_id, {'done': 'True'})

class ArbeitszeitCSV(CSVManager):
    """CSV-Manager für Arbeitszeit-Daten"""
    
    def __init__(self):
        super().__init__('arbeitszeit.csv', [
            'id', 'datum', 'start', 'stop', 'dauer', 'notdienstwoche', 'quelle', 'bemerkung'
        ])
    
    def add_entry(self, entry: Dict[str, Any]) -> bool:
        """Fügt einen neuen Arbeitszeit-Eintrag hinzu"""
        if 'id' not in entry:
            import uuid
            entry['id'] = str(uuid.uuid4())
        
        return self.append_row(entry)

# Globale Instanzen
zeiterfassung_csv = ZeiterfassungCSV()
auftraege_csv = AuftraegeCSV()
arbeitszeit_csv = ArbeitszeitCSV()

def get_csv_manager(filename: str) -> CSVManager:
    """Factory-Funktion für CSV-Manager"""
    if filename == 'zeiterfassung.csv':
        return zeiterfassung_csv
    elif filename == 'auftraege.csv':
        return auftraege_csv
    elif filename == 'arbeitszeit.csv':
        return arbeitszeit_csv
    else:
        return CSVManager(filename)

# Hilfsfunktionen für bestehende App
def lade_zeiteintraege_robust():
    """Robuste Version von lade_zeiteintraege()"""
    return zeiterfassung_csv.read_csv()

def speichere_zeiteintraege_robust(eintraege):
    """Robuste Version von speichere_zeiteintraege()"""
    return zeiterfassung_csv.write_csv(eintraege)

def lade_auftraege_robust():
    """Robuste Version von lade_auftraege()"""
    return auftraege_csv.read_csv()

def speichere_auftraege_robust(auftraege):
    """Robuste Version von speichere_auftraege()"""
    return auftraege_csv.write_csv(auftraege)

def lade_arbeitszeit_robust():
    """Robuste Version von lade_arbeitszeit()"""
    return arbeitszeit_csv.read_csv()

def speichere_arbeitszeit_robust(eintraege):
    """Robuste Version von speichere_arbeitszeit()"""
    return arbeitszeit_csv.write_csv(eintraege)

# Test-Funktionen
def test_csv_operations():
    """Testet alle CSV-Operationen"""
    logger.info("🧪 Teste CSV-Operationen")
    
    # Test Zeiterfassung
    test_entry = {
        'elevator_id': 'TEST001',
        'location': 'Test Location',
        'date': '2025-07-28',
        'activity_type': 'Test',
        'start_time': '08:00',
        'end_time': '12:00',
        'emergency_week': 'Nein',
        'notes': 'Test Entry',
        'status': 'pending',
        'mitarbeiter': 'test@example.com'
    }
    
    success = zeiterfassung_csv.add_entry(test_entry)
    logger.info(f"Zeiterfassung Test: {'✅' if success else '❌'}")
    
    # Test Aufträge
    test_auftrag = {
        'art': 'Test',
        'uhrzeit': '09:00',
        'standort': 'Test Address',
        'coords': '[]',
        'details': 'Test Auftrag',
        'done': 'False'
    }
    
    success = auftraege_csv.add_auftrag(test_auftrag)
    logger.info(f"Aufträge Test: {'✅' if success else '❌'}")
    
    # Test Arbeitszeit
    test_arbeitszeit = {
        'datum': '2025-07-28',
        'start': '08:00',
        'stop': '12:00',
        'dauer': '4:00',
        'notdienstwoche': '0',
        'quelle': 'manuell',
        'bemerkung': 'Test'
    }
    
    success = arbeitszeit_csv.add_entry(test_arbeitszeit)
    logger.info(f"Arbeitszeit Test: {'✅' if success else '❌'}")

if __name__ == '__main__':
    test_csv_operations() 
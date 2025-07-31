#!/usr/bin/env python3
"""
CSV-Debug-Skript für Zeiterfassung System
Analysiert und behebt CSV-Speicherprobleme
"""

import os
import csv
import json
import logging
from datetime import datetime
from pathlib import Path

# Logging konfigurieren
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('csv_debug.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# CSV-Dateien definieren
CSV_FILES = {
    'zeiterfassung': 'zeiterfassung.csv',
    'auftraege': 'auftraege.csv',
    'arbeitszeit': 'arbeitszeit.csv',
    'urlaub': 'urlaub.csv'
}

def analyze_csv_file(filename):
    """Analysiert eine CSV-Datei und gibt detaillierte Informationen"""
    logger.info(f"🔍 Analysiere CSV-Datei: {filename}")
    
    if not os.path.exists(filename):
        logger.warning(f"❌ Datei existiert nicht: {filename}")
        return None
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            logger.info(f"📄 Dateigröße: {len(content)} Bytes")
            
            if len(content.strip()) == 0:
                logger.warning("⚠️  Datei ist leer")
                return None
            
            # CSV parsen
            f.seek(0)
            reader = csv.DictReader(f)
            rows = list(reader)
            
            logger.info(f"📊 Anzahl Zeilen: {len(rows)}")
            if rows:
                logger.info(f"📋 Spalten: {list(rows[0].keys())}")
                
                # Erste und letzte Zeile anzeigen
                logger.info(f"🔢 Erste Zeile: {rows[0]}")
                logger.info(f"🔢 Letzte Zeile: {rows[-1]}")
                
                # Status-Statistiken
                if 'status' in rows[0]:
                    status_counts = {}
                    for row in rows:
                        status = row.get('status', 'unknown')
                        status_counts[status] = status_counts.get(status, 0) + 1
                    logger.info(f"📈 Status-Verteilung: {status_counts}")
            
            return rows
            
    except Exception as e:
        logger.error(f"❌ Fehler beim Lesen von {filename}: {e}")
        return None

def test_csv_write(filename, test_data):
    """Testet das Schreiben in eine CSV-Datei"""
    logger.info(f"✍️  Teste Schreiben in: {filename}")
    
    try:
        # Backup erstellen falls Datei existiert
        if os.path.exists(filename):
            backup_name = f"{filename}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            os.rename(filename, backup_name)
            logger.info(f"💾 Backup erstellt: {backup_name}")
        
        # Test-Daten schreiben
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            if test_data:
                writer = csv.DictWriter(f, fieldnames=test_data[0].keys())
                writer.writeheader()
                writer.writerows(test_data)
                logger.info(f"✅ {len(test_data)} Zeilen geschrieben")
        
        # Sofort wieder lesen um zu testen
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            read_data = list(reader)
            logger.info(f"📖 {len(read_data)} Zeilen gelesen")
            
            if read_data == test_data:
                logger.info("✅ Schreiben/Lesen erfolgreich")
            else:
                logger.warning("⚠️  Daten stimmen nicht überein")
                logger.debug(f"Geschrieben: {test_data}")
                logger.debug(f"Gelesen: {read_data}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Fehler beim Schreiben in {filename}: {e}")
        return False

def check_file_permissions():
    """Prüft Dateiberechtigungen"""
    logger.info("🔐 Prüfe Dateiberechtigungen")
    
    for name, filename in CSV_FILES.items():
        if os.path.exists(filename):
            try:
                # Teste Lesen
                with open(filename, 'r') as f:
                    f.read(1)
                logger.info(f"✅ {filename}: Lesen OK")
                
                # Teste Schreiben
                with open(filename, 'a') as f:
                    f.write('')
                logger.info(f"✅ {filename}: Schreiben OK")
                
            except PermissionError:
                logger.error(f"❌ {filename}: Keine Berechtigung")
            except Exception as e:
                logger.error(f"❌ {filename}: Fehler - {e}")
        else:
            logger.info(f"ℹ️  {filename}: Datei existiert nicht")

def create_test_data():
    """Erstellt Test-Daten für CSV-Tests"""
    logger.info("🧪 Erstelle Test-Daten")
    
    test_zeiterfassung = [
        {
            'id': '1',
            'elevator_id': 'E001',
            'location': 'Musterstraße 1',
            'date': '2025-07-28',
            'activity_type': 'Wartung',
            'start_time': '08:00',
            'end_time': '12:00',
            'emergency_week': '0',
            'notes': 'Test-Eintrag',
            'status': 'pending',
            'mitarbeiter': 'test@example.com'
        }
    ]
    
    test_auftraege = [
        {
            'id': '1',
            'art': 'Reparatur',
            'uhrzeit': '09:00',
            'standort': 'Test-Adresse',
            'coords': '[]',
            'details': 'Test-Auftrag',
            'done': 'False'
        }
    ]
    
    return {
        'zeiterfassung.csv': test_zeiterfassung,
        'auftraege.csv': test_auftraege
    }

def analyze_all_csv_files():
    """Analysiert alle CSV-Dateien"""
    logger.info("🚀 Starte CSV-Analyse")
    
    # Dateiberechtigungen prüfen
    check_file_permissions()
    
    # Alle CSV-Dateien analysieren
    for name, filename in CSV_FILES.items():
        logger.info(f"\n{'='*50}")
        logger.info(f"📁 Analysiere {name}: {filename}")
        logger.info(f"{'='*50}")
        
        data = analyze_csv_file(filename)
        
        if data is not None:
            logger.info(f"✅ {name}: {len(data)} Einträge gefunden")
        else:
            logger.warning(f"⚠️  {name}: Keine Daten oder Fehler")

def test_csv_operations():
    """Testet CSV-Operationen"""
    logger.info("🧪 Teste CSV-Operationen")
    
    test_data = create_test_data()
    
    for filename, data in test_data.items():
        logger.info(f"\n{'='*50}")
        logger.info(f"🧪 Teste {filename}")
        logger.info(f"{'='*50}")
        
        success = test_csv_write(filename, data)
        if success:
            logger.info(f"✅ {filename}: Test erfolgreich")
        else:
            logger.error(f"❌ {filename}: Test fehlgeschlagen")

def main():
    """Hauptfunktion"""
    logger.info("🔧 CSV-Debug-Skript gestartet")
    
    # 1. Analysiere bestehende CSV-Dateien
    analyze_all_csv_files()
    
    # 2. Teste CSV-Operationen
    test_csv_operations()
    
    logger.info("✅ CSV-Analyse abgeschlossen")
    logger.info("📋 Log-Datei: csv_debug.log")

if __name__ == '__main__':
    main() 
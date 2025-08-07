from typing import Dict, List, Any, Optional
from backend.utils.db import get_db_connection
from backend.utils.auth import get_current_user
import sqlite3
from flask import has_request_context

class GenericCrudService:
    """Generischer CRUD-Service für alle Entitäten"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        # Nur User setzen wenn Request-Context existiert
        self.user = get_current_user() if has_request_context() else None
    
    def get_current_user_safe(self):
        """Sichere User-Abfrage mit Request-Context-Check"""
        if has_request_context():
            return get_current_user()
        return None
    
    def get_all(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Holt alle Einträge mit optionalen Filtern"""
        conn = get_db_connection()
        
        query = f'SELECT * FROM {self.table_name}'
        params = []
        
        if filters:
            conditions = []
            for key, value in filters.items():
                if value != 'all':
                    if key == 'status' and value == 'done':
                        conditions.append('done = 1')
                    elif key == 'status' and value == 'pending':
                        conditions.append('done = 0')
                    else:
                        conditions.append(f'{key} = ?')
                        params.append(value)
            
            if conditions:
                query += ' WHERE ' + ' AND '.join(conditions)
        
        query += ' ORDER BY created_at DESC'
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        
        result = []
        for row in rows:
            item = dict(row)
            # Boolean-Konvertierung für done-Felder
            if 'done' in item:
                item['done'] = bool(item['done'])
            if 'emergency_week' in item:
                item['emergency_week'] = bool(item['emergency_week'])
            result.append(item)
        
        conn.close()
        return result
    
    def get_by_id(self, item_id: Any) -> Optional[Dict[str, Any]]:
        """Holt einen Eintrag nach ID"""
        conn = get_db_connection()
        
        cursor = conn.execute(f'SELECT * FROM {self.table_name} WHERE id = ?', (item_id,))
        row = cursor.fetchone()
        
        if row:
            item = dict(row)
            if 'done' in item:
                item['done'] = bool(item['done'])
            if 'emergency_week' in item:
                item['emergency_week'] = bool(item['emergency_week'])
            conn.close()
            return item
        
        conn.close()
        return None
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Erstellt einen neuen Eintrag"""
        conn = get_db_connection()
        
        # Füge Benutzer hinzu, falls nicht vorhanden
        current_user = self.get_current_user_safe()
        if 'mitarbeiter' not in data and current_user:
            data['mitarbeiter'] = current_user.get('email')
        
        # Entferne None-Werte
        data = {k: v for k, v in data.items() if v is not None}
        
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        values = list(data.values())
        
        query = f'INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})'
        
        cursor = conn.execute(query, values)
        conn.commit()
        
        new_id = cursor.lastrowid
        conn.close()
        
        return {'success': True, 'id': new_id}
    
    def update(self, item_id: Any, data: Dict[str, Any]) -> Dict[str, Any]:
        """Aktualisiert einen Eintrag"""
        conn = get_db_connection()
        
        # Entferne None-Werte
        data = {k: v for k, v in data.items() if v is not None}
        
        if not data:
            conn.close()
            return {'error': 'Keine Daten zum Aktualisieren'}
        
        set_clause = ', '.join([f'{k} = ?' for k in data.keys()])
        values = list(data.values()) + [item_id]
        
        query = f'UPDATE {self.table_name} SET {set_clause} WHERE id = ?'
        
        cursor = conn.execute(query, values)
        conn.commit()
        conn.close()
        
        return {'success': True}
    
    def delete(self, item_id: Any) -> Dict[str, Any]:
        """Löscht einen Eintrag"""
        conn = get_db_connection()
        
        cursor = conn.execute(f'DELETE FROM {self.table_name} WHERE id = ?', (item_id,))
        conn.commit()
        conn.close()
        
        return {'success': True}

class AuftraegeService(GenericCrudService):
    """Spezialisierter Service für Aufträge"""
    
    def __init__(self):
        super().__init__('auftraege')
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Überschreibt create für Aufträge-spezifische Logik"""
        # Setze Standardwerte
        data.setdefault('coords', '[]')
        data.setdefault('details', '')
        data.setdefault('priority', 'normal')
        data.setdefault('done', False)
        
        return super().create(data)

class ZeiterfassungService(GenericCrudService):
    """Spezialisierter Service für Zeiterfassung"""
    
    def __init__(self):
        super().__init__('zeiterfassung')
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Überschreibt create für Zeiterfassung-spezifische Logik"""
        data.setdefault('emergency_week', False)
        data.setdefault('status', 'pending')
        
        return super().create(data)

class ArbeitszeitService(GenericCrudService):
    """Spezialisierter Service für Arbeitszeit"""
    
    def __init__(self):
        super().__init__('arbeitszeit')
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Überschreibt create für Arbeitszeit-spezifische Logik"""
        data.setdefault('pause', '00:00')
        
        return super().create(data)

class UrlaubService(GenericCrudService):
    """Spezialisierter Service für Urlaub"""
    
    def __init__(self):
        super().__init__('urlaub')
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Überschreibt create für Urlaub-spezifische Logik"""
        data.setdefault('typ', 'Urlaub')
        data.setdefault('status', 'pending')
        
        return super().create(data) 
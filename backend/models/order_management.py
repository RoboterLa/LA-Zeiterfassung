from typing import Dict, List, Optional
from datetime import datetime
import json
from backend.utils.db import get_db_connection

class Order:
    """Auftrag-Modell"""
    def __init__(self, id: Optional[int], art: str, uhrzeit: str, standort: str,
                 coords: str = "", details: str = "", done: bool = False,
                 priority: str = "normal", mitarbeiter: str = "", created_at: str = ""):
        self.id = id
        self.art = art
        self.uhrzeit = uhrzeit
        self.standort = standort
        self.coords = coords
        self.details = details
        self.done = done
        self.priority = priority
        self.mitarbeiter = mitarbeiter
        self.created_at = created_at

class OrderService:
    """Service für Auftragsverwaltung und Kartenansicht"""
    
    @staticmethod
    def create_order(art: str, uhrzeit: str, standort: str, coords: str = "",
                    details: str = "", priority: str = "normal") -> Dict:
        """Erstellt neuen Auftrag"""
        
        if not art or not uhrzeit or not standort:
            return {
                'success': False,
                'error': 'Art, Uhrzeit und Standort sind Pflichtfelder'
            }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO auftraege (art, uhrzeit, standort, coords, details, priority)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (art, uhrzeit, standort, coords, details, priority))
        
        order_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'message': 'Auftrag erstellt',
            'order_id': order_id
        }
    
    @staticmethod
    def get_all_orders(filters: Dict = None) -> List[Dict]:
        """Holt alle Aufträge mit optionalen Filtern"""
        
        query = '''
            SELECT * FROM auftraege 
            WHERE 1=1
        '''
        params = []
        
        if filters:
            if filters.get('done') is not None:
                query += ' AND done = ?'
                params.append(filters['done'])
            
            if filters.get('priority'):
                query += ' AND priority = ?'
                params.append(filters['priority'])
            
            if filters.get('mitarbeiter'):
                query += ' AND mitarbeiter = ?'
                params.append(filters['mitarbeiter'])
            
            if filters.get('art'):
                query += ' AND art LIKE ?'
                params.append(f'%{filters["art"]}%')
        
        query += ' ORDER BY priority DESC, created_at DESC'
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    @staticmethod
    def get_orders_for_map(bounds: Dict = None) -> List[Dict]:
        """Holt Aufträge für Kartenansicht"""
        
        orders = OrderService.get_all_orders()
        
        # Filtere nach Koordinaten-Bounds falls angegeben
        if bounds:
            filtered_orders = []
            for order in orders:
                if order['coords']:
                    try:
                        lat, lng = map(float, order['coords'].split(','))
                        if (bounds['south'] <= lat <= bounds['north'] and
                            bounds['west'] <= lng <= bounds['east']):
                            filtered_orders.append(order)
                    except ValueError:
                        continue
            orders = filtered_orders
        
        # Formatiere für Kartenansicht
        map_orders = []
        for order in orders:
            if order['coords']:
                try:
                    lat, lng = map(float, order['coords'].split(','))
                    map_orders.append({
                        'id': order['id'],
                        'art': order['art'],
                        'uhrzeit': order['uhrzeit'],
                        'standort': order['standort'],
                        'details': order['details'],
                        'done': order['done'],
                        'priority': order['priority'],
                        'mitarbeiter': order['mitarbeiter'],
                        'lat': lat,
                        'lng': lng,
                        'created_at': order['created_at']
                    })
                except ValueError:
                    continue
        
        return map_orders
    
    @staticmethod
    def assign_order_to_employee(order_id: int, mitarbeiter: str) -> Dict:
        """Weist Auftrag Mitarbeiter zu"""
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE auftraege 
            SET mitarbeiter = ?
            WHERE id = ?
        ''', (mitarbeiter, order_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return {
            'success': success,
            'message': f'Auftrag {"zugewiesen" if success else "nicht gefunden"}'
        }
    
    @staticmethod
    def mark_order_done(order_id: int) -> Dict:
        """Markiert Auftrag als erledigt"""
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE auftraege 
            SET done = TRUE
            WHERE id = ?
        ''', (order_id,))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return {
            'success': success,
            'message': f'Auftrag {"erledigt" if success else "nicht gefunden"}'
        }
    
    @staticmethod
    def get_order_statistics() -> Dict:
        """Holt Auftrags-Statistiken"""
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Gesamtanzahl
        cursor.execute('SELECT COUNT(*) as total FROM auftraege')
        total = cursor.fetchone()['total']
        
        # Erledigte Aufträge
        cursor.execute('SELECT COUNT(*) as done FROM auftraege WHERE done = TRUE')
        done = cursor.fetchone()['done']
        
        # Offene Aufträge
        cursor.execute('SELECT COUNT(*) as open FROM auftraege WHERE done = FALSE')
        open_count = cursor.fetchone()['open']
        
        # Nach Priorität
        cursor.execute('''
            SELECT priority, COUNT(*) as count 
            FROM auftraege 
            WHERE done = FALSE 
            GROUP BY priority
        ''')
        priority_stats = {row['priority']: row['count'] for row in cursor.fetchall()}
        
        # Nach Mitarbeiter
        cursor.execute('''
            SELECT mitarbeiter, COUNT(*) as count 
            FROM auftraege 
            WHERE done = FALSE AND mitarbeiter != ''
            GROUP BY mitarbeiter
        ''')
        employee_stats = {row['mitarbeiter']: row['count'] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            'total_orders': total,
            'done_orders': done,
            'open_orders': open_count,
            'completion_rate': f"{(done/total*100):.1f}%" if total > 0 else "0%",
            'priority_distribution': priority_stats,
            'employee_distribution': employee_stats
        }
    
    @staticmethod
    def search_orders(search_term: str) -> List[Dict]:
        """Sucht Aufträge nach Suchbegriff"""
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM auftraege 
            WHERE art LIKE ? OR standort LIKE ? OR details LIKE ? OR mitarbeiter LIKE ?
            ORDER BY priority DESC, created_at DESC
        ''', (f'%{search_term}%', f'%{search_term}%', f'%{search_term}%', f'%{search_term}%'))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    @staticmethod
    def get_navigation_link(order_id: int) -> Dict:
        """Generiert Navigationslink für Auftrag"""
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT standort, coords FROM auftraege WHERE id = ?', (order_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {'success': False, 'error': 'Auftrag nicht gefunden'}
        
        if row['coords']:
            try:
                lat, lng = map(float, row['coords'].split(','))
                # Google Maps Navigation Link
                nav_link = f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
                return {
                    'success': True,
                    'navigation_link': nav_link,
                    'coordinates': {'lat': lat, 'lng': lng},
                    'address': row['standort']
                }
            except ValueError:
                pass
        
        # Fallback: Adresse für Navigation
        nav_link = f"https://www.google.com/maps/search/{row['standort']}"
        return {
            'success': True,
            'navigation_link': nav_link,
            'address': row['standort']
        }

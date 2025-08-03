from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
import sqlite3
import os

monteur_bp = Blueprint('monteur', __name__, url_prefix='/api/monteur')

def get_db_connection():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'zeiterfassung.db')
    return sqlite3.connect(db_path)

# ===== ZEITERFASSUNG ENDPUNKTE =====

@monteur_bp.route('/clock-in', methods=['POST'])
def clock_in():
    """Monteur Einstempeln"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können einstempeln'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Prüfe ob bereits eingestempelt
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            SELECT id FROM zeiterfassung 
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        """, (user['email'], today))
        
        if cursor.fetchone():
            return jsonify({'error': 'Bereits eingestempelt'}), 400
        
        # Erstelle neuen Eintrag
        timestamp = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO zeiterfassung (user_id, date, clock_in, status)
            VALUES (?, ?, ?, ?)
        """, (user['email'], today, timestamp, 'active'))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Erfolgreich eingestempelt',
            'timestamp': timestamp
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/clock-out', methods=['POST'])
def clock_out():
    """Monteur Ausstempeln"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können ausstempeln'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Finde aktiven Eintrag
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            SELECT id, clock_in FROM zeiterfassung 
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        """, (user['email'], today))
        
        entry = cursor.fetchone()
        if not entry:
            return jsonify({'error': 'Kein aktiver Eintrag gefunden'}), 400
        
        entry_id, clock_in = entry
        
        # Berechne Arbeitszeit
        clock_in_dt = datetime.fromisoformat(clock_in.replace('Z', '+00:00'))
        clock_out_dt = datetime.now()
        work_hours = (clock_out_dt - clock_in_dt).total_seconds() / 3600
        
        # Update Eintrag
        timestamp = clock_out_dt.isoformat()
        cursor.execute("""
            UPDATE zeiterfassung 
            SET clock_out = ?, total_hours = ?, status = ?
            WHERE id = ?
        """, (timestamp, round(work_hours, 2), 'completed', entry_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Erfolgreich ausgestempelt',
            'work_hours': round(work_hours, 2),
            'timestamp': timestamp
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/time-entries', methods=['GET'])
def get_time_entries():
    """Zeiterfassung-Einträge abrufen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Einträge abrufen'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT date, clock_in, clock_out, total_hours, status
            FROM zeiterfassung 
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT 10
        """, (user['email'],))
        
        entries = []
        for row in cursor.fetchall():
            entries.append({
                'date': row[0],
                'clock_in': row[1],
                'clock_out': row[2],
                'total_hours': row[3],
                'status': row[4]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'entries': entries
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/current-status', methods=['GET'])
def get_current_status():
    """Aktueller Status abrufen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Status abrufen'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            SELECT id FROM zeiterfassung 
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        """, (user['email'], today))
        
        is_clocked_in = cursor.fetchone() is not None
        conn.close()
        
        return jsonify({
            'success': True,
            'status': 'eingeloggt' if is_clocked_in else 'ausgeloggt'
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/work-summary', methods=['GET'])
def get_work_summary():
    """Arbeitszeit-Zusammenfassung abrufen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Zusammenfassung abrufen'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            SELECT SUM(total_hours) as total_hours, COUNT(*) as entries_count
            FROM zeiterfassung 
            WHERE user_id = ? AND date = ?
        """, (user['email'], today))
        
        result = cursor.fetchone()
        total_hours = result[0] or 0
        entries_count = result[1] or 0
        
        # Berechne reguläre Stunden und Überstunden
        regular_hours = min(total_hours, 8.0)
        overtime_hours = max(0, total_hours - 8.0)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'summary': {
                'total_hours': round(total_hours, 2),
                'regular_hours': round(regular_hours, 2),
                'overtime_hours': round(overtime_hours, 2),
                'entries_count': entries_count
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

# ===== ARBEITSZEIT ENDPUNKTE =====

@monteur_bp.route('/vacation-requests', methods=['GET'])
def get_vacation_requests():
    """Urlaubsanträge abrufen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Urlaubsanträge abrufen'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, start_date, end_date, reason, status, created_at
            FROM vacation_requests 
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user['email'],))
        
        requests = []
        for row in cursor.fetchall():
            requests.append({
                'id': row[0],
                'start_date': row[1],
                'end_date': row[2],
                'reason': row[3],
                'status': row[4],
                'created_at': row[5]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'requests': requests
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/vacation-request', methods=['POST'])
def create_vacation_request():
    """Urlaubsantrag erstellen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Urlaubsanträge erstellen'}), 403
    
    data = request.get_json()
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    reason = data.get('reason', '')
    
    if not start_date or not end_date:
        return jsonify({'error': 'Start- und Enddatum erforderlich'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO vacation_requests (user_id, start_date, end_date, reason, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user['email'], start_date, end_date, reason, 'pending', datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Urlaubsantrag erfolgreich erstellt'
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/sick-leave', methods=['POST'])
def create_sick_leave():
    """Krankmeldung erstellen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Krankmeldungen erstellen'}), 403
    
    data = request.get_json()
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    reason = data.get('reason', '')
    
    if not start_date:
        return jsonify({'error': 'Startdatum erforderlich'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO sick_leaves (user_id, start_date, end_date, reason, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user['email'], start_date, end_date, reason, 'pending', datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Krankmeldung erfolgreich erstellt'
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

# ===== AUFTRÄGE ENDPUNKTE =====

@monteur_bp.route('/orders', methods=['GET'])
def get_orders():
    """Aufträge abrufen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Aufträge abrufen'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, location, description, status, assigned_date
            FROM orders 
            WHERE assigned_to = ?
            ORDER BY assigned_date DESC
        """, (user['email'],))
        
        orders = []
        for row in cursor.fetchall():
            orders.append({
                'id': row[0],
                'title': row[1],
                'location': row[2],
                'description': row[3],
                'status': row[4],
                'assigned_date': row[5]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'orders': orders
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/daily-reports', methods=['GET'])
def get_daily_reports():
    """Tagesberichte abrufen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Tagesberichte abrufen'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, date, order_id, work_description, hours_worked, status
            FROM daily_reports 
            WHERE user_id = ?
            ORDER BY date DESC
        """, (user['email'],))
        
        reports = []
        for row in cursor.fetchall():
            reports.append({
                'id': row[0],
                'date': row[1],
                'order_id': row[2],
                'work_description': row[3],
                'hours_worked': row[4],
                'status': row[5]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'reports': reports
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/daily-report', methods=['POST'])
def create_daily_report():
    """Tagesbericht erstellen"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Tagesberichte erstellen'}), 403
    
    data = request.get_json()
    order_id = data.get('order_id')
    work_description = data.get('work_description')
    hours_worked = data.get('hours_worked')
    
    if not work_description or not hours_worked:
        return jsonify({'error': 'Arbeitsbeschreibung und Arbeitsstunden erforderlich'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            INSERT INTO daily_reports (user_id, date, order_id, work_description, hours_worked, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user['email'], today, order_id, work_description, hours_worked, 'pending', datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Tagesbericht erfolgreich erstellt'
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

# ===== PAUSEN ENDPUNKTE =====

@monteur_bp.route('/start-break', methods=['POST'])
def start_break():
    """Pause starten"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Pausen starten'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Prüfe ob bereits eingestempelt
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("""
            SELECT id FROM zeiterfassung 
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        """, (user['email'], today))
        
        if not cursor.fetchone():
            return jsonify({'error': 'Nicht eingestempelt'}), 400
        
        # Starte Pause
        timestamp = datetime.now().isoformat()
        cursor.execute("""
            UPDATE zeiterfassung 
            SET break_start = ?, status = 'break'
            WHERE user_id = ? AND date = ? AND clock_out IS NULL
        """, (timestamp, user['email'], today))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Pause gestartet',
            'timestamp': timestamp
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

@monteur_bp.route('/end-break', methods=['POST'])
def end_break():
    """Pause beenden"""
    if 'user' not in session:
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    user = session['user']
    if user['role'] != 'Monteur':
        return jsonify({'error': 'Nur Monteure können Pausen beenden'}), 403
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Beende Pause
        timestamp = datetime.now().isoformat()
        cursor.execute("""
            UPDATE zeiterfassung 
            SET break_end = ?, status = 'active'
            WHERE user_id = ? AND date = ? AND clock_out IS NULL AND status = 'break'
        """, (timestamp, user['email'], datetime.now().strftime('%Y-%m-%d')))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Pause beendet',
            'timestamp': timestamp
        })
        
    except Exception as e:
        return jsonify({'error': f'Datenbankfehler: {str(e)}'}), 500

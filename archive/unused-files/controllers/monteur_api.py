from flask import Blueprint, request, jsonify, session
from datetime import datetime
from backend.services.time_tracking_service import TimeTrackingService
from backend.services.vacation_service import VacationService
from backend.services.order_service import OrderService
from backend.models.database import get_db, User
import logging

logger = logging.getLogger(__name__)

monteur_bp = Blueprint('monteur', __name__, url_prefix='/api/monteur')

def get_current_user_id():
    """Aktuelle Benutzer-ID aus Session abrufen"""
    if 'user' not in session:
        return None
    return session['user'].get('id')

def get_user_by_email(db, email: str):
    """Benutzer anhand Email abrufen"""
    return db.query(User).filter(User.email == email).first()

# ===== ZEITERFASSUNG ENDPUNKTE =====

@monteur_bp.route('/clock-in', methods=['POST'])
def clock_in():
    """Einstempeln"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = TimeTrackingService.clock_in(db, user_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in clock_in: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/clock-out', methods=['POST'])
def clock_out():
    """Ausstempeln"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = TimeTrackingService.clock_out(db, user_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in clock_out: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/start-break', methods=['POST'])
def start_break():
    """Pause starten"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = TimeTrackingService.start_break(db, user_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in start_break: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/end-break', methods=['POST'])
def end_break():
    """Pause beenden"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = TimeTrackingService.end_break(db, user_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in end_break: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/current-status', methods=['GET'])
def current_status():
    """Aktuellen Status abrufen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = TimeTrackingService.get_current_status(db, user_id)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in current_status: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/time-entries', methods=['GET'])
def time_entries():
    """Zeiteinträge abrufen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        days = request.args.get('days', 7, type=int)
        result = TimeTrackingService.get_time_entries(db, user_id, days)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in time_entries: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/work-summary', methods=['GET'])
def work_summary():
    """Arbeitszeit-Zusammenfassung"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        days = request.args.get('days', 7, type=int)
        result = TimeTrackingService.get_work_summary(db, user_id, days)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in work_summary: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

# ===== ARBEITSZEIT ENDPUNKTE =====

@monteur_bp.route('/vacation-requests', methods=['GET'])
def get_vacation_requests():
    """Urlaubsanträge abrufen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = VacationService.get_vacation_requests(db, user_id)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in get_vacation_requests: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/vacation-request', methods=['POST'])
def create_vacation_request():
    """Urlaubsantrag erstellen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Keine Daten erhalten"}), 400
        
        # Validierung
        required_fields = ['start_date', 'end_date', 'reason']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"success": False, "error": f"Feld '{field}' ist erforderlich"}), 400
        
        result = VacationService.create_vacation_request(db, user_id, data)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_vacation_request: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/vacation-request/<int:request_id>', methods=['PUT'])
def update_vacation_request(request_id):
    """Urlaubsantrag aktualisieren"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Keine Daten erhalten"}), 400
        
        result = VacationService.update_vacation_request(db, request_id, user_id, data)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in update_vacation_request: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/vacation-request/<int:request_id>', methods=['DELETE'])
def delete_vacation_request(request_id):
    """Urlaubsantrag löschen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = VacationService.delete_vacation_request(db, request_id, user_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in delete_vacation_request: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/sick-leave', methods=['POST'])
def create_sick_leave():
    """Krankmeldung erstellen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Keine Daten erhalten"}), 400
        
        # Validierung
        if 'start_date' not in data or not data['start_date']:
            return jsonify({"success": False, "error": "Startdatum ist erforderlich"}), 400
        
        # Krankmeldung erstellen (vereinfacht)
        from backend.models.models import SickLeave
        
        sick_leave = SickLeave(
            user_id=user_id,
            start_date=data['start_date'],
            end_date=data.get('end_date'),
            reason=data.get('reason', ''),
            status='pending'
        )
        
        db.add(sick_leave)
        db.commit()
        db.refresh(sick_leave)
        
        return jsonify({
            "success": True, 
            "message": "Krankmeldung erstellt", 
            "sick_leave": sick_leave.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error in create_sick_leave: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

# ===== AUFTRÄGE ENDPUNKTE =====

@monteur_bp.route('/orders', methods=['GET'])
def get_orders():
    """Aufträge abrufen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = OrderService.get_orders(db, user_id)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in get_orders: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/daily-reports', methods=['GET'])
def get_daily_reports():
    """Tagesberichte abrufen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = OrderService.get_daily_reports(db, user_id)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in get_daily_reports: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/daily-report', methods=['POST'])
def create_daily_report():
    """Tagesbericht erstellen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Keine Daten erhalten"}), 400
        
        # Validierung
        required_fields = ['date', 'location', 'activity']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"success": False, "error": f"Feld '{field}' ist erforderlich"}), 400
        
        result = OrderService.create_daily_report(db, user_id, data)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_daily_report: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/daily-report/<int:report_id>', methods=['PUT'])
def update_daily_report(report_id):
    """Tagesbericht aktualisieren"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Keine Daten erhalten"}), 400
        
        result = OrderService.update_daily_report(db, report_id, user_id, data)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in update_daily_report: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

@monteur_bp.route('/daily-report/<int:report_id>', methods=['DELETE'])
def delete_daily_report(report_id):
    """Tagesbericht löschen"""
    try:
        db = next(get_db())
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({"success": False, "error": "Nicht angemeldet"}), 401
        
        result = OrderService.delete_daily_report(db, report_id, user_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in delete_daily_report: {str(e)}")
        return jsonify({"success": False, "error": "Server-Fehler"}), 500

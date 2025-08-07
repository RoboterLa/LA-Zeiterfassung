from flask import Blueprint, request, jsonify, session
from datetime import datetime
from backend.services.vacation_service import VacationService
from backend.models.database import get_db, User
import logging

logger = logging.getLogger(__name__)

arbeitszeit_bp = Blueprint('arbeitszeit', __name__, url_prefix='/api/arbeitszeit')

def get_current_user_id():
    """Aktuelle Benutzer-ID aus Session abrufen"""
    if 'user' not in session:
        return None
    return session['user'].get('id')

@arbeitszeit_bp.route('/vacation-requests', methods=['GET'])
def get_vacation_requests():
    """Alle Urlaubsanträge des aktuellen Benutzers abrufen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        db = next(get_db())
        vacation_requests = VacationService.get_vacation_requests(db, user_id)
        
        return jsonify({
            'success': True,
            'vacation_requests': [req.to_dict() for req in vacation_requests]
        })
    except Exception as e:
        logger.error(f"Error fetching vacation requests: {e}")
        return jsonify({'error': 'Fehler beim Laden der Urlaubsanträge'}), 500

@arbeitszeit_bp.route('/vacation-request', methods=['POST'])
def create_vacation_request():
    """Neuen Urlaubsantrag erstellen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        data = request.get_json()
        required_fields = ['type', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Feld {field} ist erforderlich'}), 400
        
        db = next(get_db())
        vacation_request = VacationService.create_vacation_request(
            db=db,
            user_id=user_id,
            request_type=data['type'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            is_half_day=data.get('is_half_day', False),
            comment=data.get('comment', '')
        )
        
        return jsonify({
            'success': True,
            'message': 'Urlaubsantrag erfolgreich erstellt',
            'vacation_request': vacation_request.to_dict()
        })
    except Exception as e:
        logger.error(f"Error creating vacation request: {e}")
        return jsonify({'error': 'Fehler beim Erstellen des Urlaubsantrags'}), 500

@arbeitszeit_bp.route('/sick-leaves', methods=['GET'])
def get_sick_leaves():
    """Alle Krankmeldungen des aktuellen Benutzers abrufen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        db = next(get_db())
        sick_leaves = VacationService.get_sick_leaves(db, user_id)
        
        return jsonify({
            'success': True,
            'sick_leaves': [leave.to_dict() for leave in sick_leaves]
        })
    except Exception as e:
        logger.error(f"Error fetching sick leaves: {e}")
        return jsonify({'error': 'Fehler beim Laden der Krankmeldungen'}), 500

@arbeitszeit_bp.route('/sick-leave', methods=['POST'])
def create_sick_leave():
    """Neue Krankmeldung erstellen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        data = request.get_json()
        required_fields = ['start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Feld {field} ist erforderlich'}), 400
        
        db = next(get_db())
        sick_leave = VacationService.create_sick_leave(
            db=db,
            user_id=user_id,
            start_date=data['start_date'],
            end_date=data['end_date'],
            comment=data.get('comment', '')
        )
        
        return jsonify({
            'success': True,
            'message': 'Krankmeldung erfolgreich erstellt',
            'sick_leave': sick_leave.to_dict()
        })
    except Exception as e:
        logger.error(f"Error creating sick leave: {e}")
        return jsonify({'error': 'Fehler beim Erstellen der Krankmeldung'}), 500

@arbeitszeit_bp.route('/summary', methods=['GET'])
def get_work_summary():
    """Arbeitszeit-Zusammenfassung abrufen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        db = next(get_db())
        
        # Urlaubsanträge zählen
        vacation_requests = VacationService.get_vacation_requests(db, user_id)
        pending_vacations = [req for req in vacation_requests if req.status == 'pending']
        
        # Krankmeldungen zählen
        sick_leaves = VacationService.get_sick_leaves(db, user_id)
        pending_sick_leaves = [leave for leave in sick_leaves if leave.status == 'pending']
        
        return jsonify({
            'success': True,
            'summary': {
                'total_vacation_requests': len(vacation_requests),
                'pending_vacation_requests': len(pending_vacations),
                'total_sick_leaves': len(sick_leaves),
                'pending_sick_leaves': len(pending_sick_leaves),
                'upcoming_vacations': len([req for req in vacation_requests if req.status == 'approved'])
            }
        })
    except Exception as e:
        logger.error(f"Error fetching work summary: {e}")
        return jsonify({'error': 'Fehler beim Laden der Zusammenfassung'}), 500

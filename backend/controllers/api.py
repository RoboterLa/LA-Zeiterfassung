from flask import Blueprint, request, jsonify, session
from typing import Dict, Any
from backend.services.crud_service import (
    AuftraegeService, 
    ZeiterfassungService, 
    ArbeitszeitService, 
    UrlaubService
)
from backend.utils.auth import requires_role, is_authenticated
from utils.auth import require_auth, require_role, get_current_user
from models import User, UserRole, TimeRecord, TimeRecordStatus, WorkReport, WorkReportStatus, JobSite, AbsenceRequest, AbsenceType, AbsenceStatus
from services.crud_service import time_record_service, work_report_service, user_service
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Blueprint für API-Routes
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Services initialisieren
auftraege_service = AuftraegeService()
zeiterfassung_service = ZeiterfassungService()
arbeitszeit_service = ArbeitszeitService()
urlaub_service = UrlaubService()

# Aufträge API
@api_bp.route('/auftraege', methods=['GET', 'POST'])
def api_auftraege():
    """Aufträge API - GET: Liste, POST: Erstellen"""
    if not is_authenticated():
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    if request.method == 'GET':
        # Filter-Parameter
        filters = {
            'status': request.args.get('status', 'all'),
            'priority': request.args.get('priority', 'all')
        }
        
        auftraege = auftraege_service.get_all(filters)
        return jsonify(auftraege)
    
    elif request.method == 'POST':
        data = request.get_json()
        result = auftraege_service.create(data)
        return jsonify(result)

@api_bp.route('/auftraege/<int:auftrag_id>', methods=['PUT', 'DELETE'])
def api_auftrag_detail(auftrag_id: int):
    """Auftrag Detail API - PUT: Aktualisieren, DELETE: Löschen"""
    if not is_authenticated():
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    if request.method == 'PUT':
        data = request.get_json()
        result = auftraege_service.update(auftrag_id, data)
        return jsonify(result)
    
    elif request.method == 'DELETE':
        result = auftraege_service.delete(auftrag_id)
        return jsonify(result)

# Zeiterfassung API
@api_bp.route('/zeiterfassung', methods=['GET', 'POST'])
def api_zeiterfassung():
    """Zeiterfassung API - GET: Liste, POST: Erstellen"""
    if not is_authenticated():
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    if request.method == 'GET':
        filters = {
            'status': request.args.get('status', 'all')
        }
        
        zeiterfassung = zeiterfassung_service.get_all(filters)
        return jsonify(zeiterfassung)
    
    elif request.method == 'POST':
        data = request.get_json()
        result = zeiterfassung_service.create(data)
        return jsonify(result)

@api_bp.route('/zeiterfassung/<int:entry_id>', methods=['PUT', 'DELETE'])
def api_zeiterfassung_detail(entry_id: int):
    """Zeiterfassung Detail API - PUT: Aktualisieren, DELETE: Löschen"""
    if not is_authenticated():
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    if request.method == 'PUT':
        data = request.get_json()
        result = zeiterfassung_service.update(entry_id, data)
        return jsonify(result)
    
    elif request.method == 'DELETE':
        result = zeiterfassung_service.delete(entry_id)
        return jsonify(result)

# Arbeitszeit API
@api_bp.route('/arbeitszeit', methods=['GET', 'POST'])
def api_arbeitszeit():
    """Arbeitszeit API - GET: Liste, POST: Erstellen"""
    if not is_authenticated():
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    if request.method == 'GET':
        arbeitszeit = arbeitszeit_service.get_all()
        return jsonify(arbeitszeit)
    
    elif request.method == 'POST':
        data = request.get_json()
        result = arbeitszeit_service.create(data)
        return jsonify(result)

@api_bp.route('/arbeitszeit/<string:entry_id>', methods=['PUT', 'DELETE'])
def api_arbeitszeit_detail(entry_id: str):
    """Arbeitszeit Detail API - PUT: Aktualisieren, DELETE: Löschen"""
    if not is_authenticated():
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    if request.method == 'PUT':
        data = request.get_json()
        result = arbeitszeit_service.update(entry_id, data)
        return jsonify(result)
    
    elif request.method == 'DELETE':
        result = arbeitszeit_service.delete(entry_id)
        return jsonify(result)

# Urlaub API
@api_bp.route('/urlaub', methods=['GET', 'POST'])
def api_urlaub():
    """Urlaub API - GET: Liste, POST: Erstellen"""
    if not is_authenticated():
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    if request.method == 'GET':
        urlaub = urlaub_service.get_all()
        return jsonify(urlaub)
    
    elif request.method == 'POST':
        data = request.get_json()
        result = urlaub_service.create(data)
        return jsonify(result)

@api_bp.route('/urlaub/<int:entry_id>', methods=['PUT', 'DELETE'])
def api_urlaub_detail(entry_id: int):
    """Urlaub Detail API - PUT: Aktualisieren, DELETE: Löschen"""
    if not is_authenticated():
        return jsonify({'error': 'Nicht angemeldet'}), 401
    
    if request.method == 'PUT':
        data = request.get_json()
        result = urlaub_service.update(entry_id, data)
        return jsonify(result)
    
    elif request.method == 'DELETE':
        result = urlaub_service.delete(entry_id)
        return jsonify(result)

# Status API
@api_bp.route('/status')
def api_status():
    """API Status Endpoint"""
    return jsonify({
        'status': 'online',
        'version': '1.0.0',
        'user': session.get('user', {}),
        'authenticated': is_authenticated()
    }) 

# TimeClock Endpoints
@api_bp.route('/timeclock/clock-in', methods=['POST'])
@require_auth
def clock_in():
    """Einstempeln"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prüfe ob bereits eingestempelt
        active_record = time_record_service.get_active_by_user(user.id)
        if active_record:
            return jsonify({'error': 'Already clocked in'}), 400
        
        # Neue TimeRecord erstellen
        time_record = time_record_service.create({
            'user_id': user.id,
            'clock_in': datetime.utcnow(),
            'status': TimeRecordStatus.ACTIVE
        })
        
        logger.info(f"User {user.username} clocked in")
        
        return jsonify({
            'success': True,
            'time_record': {
                'id': time_record.id,
                'clock_in': time_record.clock_in.isoformat(),
                'status': time_record.status.value
            }
        })
        
    except Exception as e:
        logger.error(f"Clock in error: {e}")
        return jsonify({'error': 'Failed to clock in'}), 500

@api_bp.route('/timeclock/clock-out', methods=['POST'])
@require_auth
def clock_out():
    """Ausstempeln"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Aktive TimeRecord finden
        active_record = time_record_service.get_active_by_user(user.id)
        if not active_record:
            return jsonify({'error': 'Not clocked in'}), 400
        
        # Ausstempeln
        clock_out_time = datetime.utcnow()
        time_record_service.update(active_record.id, {
            'clock_out': clock_out_time,
            'status': TimeRecordStatus.COMPLETED
        })
        
        # Arbeitszeit berechnen
        total_hours = (clock_out_time - active_record.clock_in).total_seconds() / 3600
        total_hours -= active_record.total_break_minutes / 60
        
        logger.info(f"User {user.username} clocked out after {total_hours:.2f} hours")
        
        return jsonify({
            'success': True,
            'time_record': {
                'id': active_record.id,
                'clock_in': active_record.clock_in.isoformat(),
                'clock_out': clock_out_time.isoformat(),
                'total_hours': round(total_hours, 2),
                'status': TimeRecordStatus.COMPLETED.value
            }
        })
        
    except Exception as e:
        logger.error(f"Clock out error: {e}")
        return jsonify({'error': 'Failed to clock out'}), 500

@api_bp.route('/timeclock/status', methods=['GET'])
@require_auth
def get_clock_status():
    """Aktueller Stempel-Status"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        active_record = time_record_service.get_active_by_user(user.id)
        
        if active_record:
            # Berechne aktuelle Arbeitszeit
            current_time = datetime.utcnow()
            total_hours = (current_time - active_record.clock_in).total_seconds() / 3600
            total_hours -= active_record.total_break_minutes / 60
            
            return jsonify({
                'success': True,
                'clocked_in': True,
                'clock_in_time': active_record.clock_in.isoformat(),
                'current_hours': round(total_hours, 2),
                'status': active_record.status.value,
                'warnings': get_time_warnings(total_hours)
            })
        else:
            return jsonify({
                'success': True,
                'clocked_in': False,
                'current_hours': 0
            })
        
    except Exception as e:
        logger.error(f"Get clock status error: {e}")
        return jsonify({'error': 'Failed to get clock status'}), 500

@api_bp.route('/timeclock/today', methods=['GET'])
@require_auth
def get_today_records():
    """Heutige Zeiterfassungen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        today = datetime.utcnow().date()
        records = time_record_service.get_by_user_and_date(user.id, today)
        
        total_hours = 0
        records_data = []
        
        for record in records:
            if record.clock_out:
                hours = (record.clock_out - record.clock_in).total_seconds() / 3600
                hours -= record.total_break_minutes / 60
                total_hours += hours
            
            records_data.append({
                'id': record.id,
                'clock_in': record.clock_in.isoformat(),
                'clock_out': record.clock_out.isoformat() if record.clock_out else None,
                'status': record.status.value,
                'total_break_minutes': record.total_break_minutes,
                'note': record.note
            })
        
        return jsonify({
            'success': True,
            'records': records_data,
            'total_hours': round(total_hours, 2),
            'warnings': get_time_warnings(total_hours)
        })
        
    except Exception as e:
        logger.error(f"Get today records error: {e}")
        return jsonify({'error': 'Failed to get today records'}), 500

@api_bp.route('/timeclock/break', methods=['POST'])
@require_auth
def start_break():
    """Pause starten"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        active_record = time_record_service.get_active_by_user(user.id)
        if not active_record:
            return jsonify({'error': 'Not clocked in'}), 400
        
        if active_record.break_start:
            return jsonify({'error': 'Break already started'}), 400
        
        time_record_service.update(active_record.id, {
            'break_start': datetime.utcnow(),
            'status': TimeRecordStatus.PAUSED
        })
        
        logger.info(f"User {user.username} started break")
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Start break error: {e}")
        return jsonify({'error': 'Failed to start break'}), 500

@api_bp.route('/timeclock/break', methods=['PUT'])
@require_auth
def end_break():
    """Pause beenden"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        active_record = time_record_service.get_active_by_user(user.id)
        if not active_record:
            return jsonify({'error': 'Not clocked in'}), 400
        
        if not active_record.break_start:
            return jsonify({'error': 'No break started'}), 400
        
        break_end = datetime.utcnow()
        break_duration = (break_end - active_record.break_start).total_seconds() / 60
        
        time_record_service.update(active_record.id, {
            'break_end': break_end,
            'total_break_minutes': active_record.total_break_minutes + break_duration,
            'status': TimeRecordStatus.ACTIVE
        })
        
        logger.info(f"User {user.username} ended break after {break_duration:.1f} minutes")
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"End break error: {e}")
        return jsonify({'error': 'Failed to end break'}), 500

# Hilfsfunktionen
def get_time_warnings(hours):
    """Gibt Warnungen basierend auf Arbeitszeit zurück"""
    warnings = []
    
    if hours >= 10:
        warnings.append({
            'type': 'critical',
            'message': 'Arbeitszeit über 10 Stunden - gesetzeswidrig!'
        })
    elif hours >= 8:
        warnings.append({
            'type': 'warning',
            'message': 'Arbeitszeit über 8 Stunden - Überstunden erforderlich'
        })
    
    return warnings

# WorkReport Endpoints
@api_bp.route('/reports', methods=['POST'])
@require_auth
def create_work_report():
    """Tagesbericht erstellen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Pflichtfelder prüfen
        required_fields = ['job_site_id', 'date', 'units', 'task_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # WorkReport erstellen
        work_report = work_report_service.create({
            'user_id': user.id,
            'job_site_id': data['job_site_id'],
            'date': datetime.fromisoformat(data['date']),
            'units': data['units'],
            'factor': data.get('factor', 1.0),
            'task_type': data['task_type'],
            'emergency_service': data.get('emergency_service', False),
            'emergency_start': datetime.fromisoformat(data['emergency_start']) if data.get('emergency_start') else None,
            'emergency_end': datetime.fromisoformat(data['emergency_end']) if data.get('emergency_end') else None,
            'status': WorkReportStatus.DRAFT
        })
        
        logger.info(f"Work report created by {user.username}")
        
        return jsonify({
            'success': True,
            'work_report': {
                'id': work_report.id,
                'status': work_report.status.value
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Create work report error: {e}")
        return jsonify({'error': 'Failed to create work report'}), 500

@api_bp.route('/reports/<int:report_id>/submit', methods=['POST'])
@require_auth
def submit_work_report(report_id):
    """Tagesbericht einreichen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        work_report = work_report_service.get_by_id(report_id)
        if not work_report:
            return jsonify({'error': 'Work report not found'}), 404
        
        if work_report.user_id != user.id:
            return jsonify({'error': 'Not authorized'}), 403
        
        if work_report.status != WorkReportStatus.DRAFT:
            return jsonify({'error': 'Report already submitted'}), 400
        
        work_report_service.update(report_id, {
            'status': WorkReportStatus.SUBMITTED
        })
        
        logger.info(f"Work report {report_id} submitted by {user.username}")
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Submit work report error: {e}")
        return jsonify({'error': 'Failed to submit work report'}), 500

@api_bp.route('/reports/<int:report_id>/approve', methods=['POST'])
@require_auth
@require_role(UserRole.MEISTER.value, UserRole.ADMIN.value)
def approve_work_report(report_id):
    """Tagesbericht genehmigen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        work_report = work_report_service.get_by_id(report_id)
        if not work_report:
            return jsonify({'error': 'Work report not found'}), 404
        
        if work_report.status != WorkReportStatus.SUBMITTED:
            return jsonify({'error': 'Report not submitted for approval'}), 400
        
        work_report_service.approve_report(report_id, user.id)
        
        logger.info(f"Work report {report_id} approved by {user.username}")
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Approve work report error: {e}")
        return jsonify({'error': 'Failed to approve work report'}), 500

@api_bp.route('/reports/<int:report_id>/reject', methods=['POST'])
@require_auth
@require_role(UserRole.MEISTER.value, UserRole.ADMIN.value)
def reject_work_report(report_id):
    """Tagesbericht ablehnen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        reason = data.get('reason', '')
        
        work_report = work_report_service.get_by_id(report_id)
        if not work_report:
            return jsonify({'error': 'Work report not found'}), 404
        
        if work_report.status != WorkReportStatus.SUBMITTED:
            return jsonify({'error': 'Report not submitted for approval'}), 400
        
        work_report_service.reject_report(report_id, user.id, reason)
        
        logger.info(f"Work report {report_id} rejected by {user.username}")
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Reject work report error: {e}")
        return jsonify({'error': 'Failed to reject work report'}), 500

# Job Sites Endpoints
@api_bp.route('/sites', methods=['GET'])
@require_auth
def get_sites():
    """Alle Job Sites abrufen"""
    try:
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            sites = session.query(JobSite).filter(JobSite.is_active == True).all()
            
            sites_data = []
            for site in sites:
                sites_data.append({
                    'id': site.id,
                    'name': site.name,
                    'address': site.address,
                    'latitude': site.latitude,
                    'longitude': site.longitude,
                    'factory_number': site.factory_number,
                    'project_number': site.project_number,
                    'order_number': site.order_number,
                    'created_at': site.created_at.isoformat() if site.created_at else None,
                    'updated_at': site.updated_at.isoformat() if site.updated_at else None
                })
            
            return jsonify({
                'success': True,
                'sites': sites_data
            })
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Get sites error: {e}")
        return jsonify({'error': 'Failed to get sites'}), 500

@api_bp.route('/sites/<int:site_id>', methods=['GET'])
@require_auth
def get_site(site_id):
    """Einzelnen Job Site abrufen"""
    try:
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            site = session.query(JobSite).filter(JobSite.id == site_id).first()
            if not site:
                return jsonify({'error': 'Site not found'}), 404
            
            site_data = {
                'id': site.id,
                'name': site.name,
                'address': site.address,
                'latitude': site.latitude,
                'longitude': site.longitude,
                'factory_number': site.factory_number,
                'project_number': site.project_number,
                'order_number': site.order_number,
                'created_at': site.created_at.isoformat() if site.created_at else None,
                'updated_at': site.updated_at.isoformat() if site.updated_at else None
            }
            
            return jsonify({
                'success': True,
                'site': site_data
            })
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Get site error: {e}")
        return jsonify({'error': 'Failed to get site'}), 500

@api_bp.route('/sites', methods=['POST'])
@require_auth
@require_role(UserRole.ADMIN.value, UserRole.MEISTER.value)
def create_site():
    """Job Site erstellen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Pflichtfelder prüfen
        required_fields = ['name', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            site = JobSite(
                name=data['name'],
                address=data['address'],
                latitude=data.get('latitude'),
                longitude=data.get('longitude'),
                factory_number=data.get('factory_number'),
                project_number=data.get('project_number'),
                order_number=data.get('order_number'),
                is_active=True
            )
            
            session.add(site)
            session.commit()
            session.refresh(site)
            
            logger.info(f"Job site created by {user.username}: {site.name}")
            
            return jsonify({
                'success': True,
                'site': {
                    'id': site.id,
                    'name': site.name,
                    'address': site.address
                }
            }), 201
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Create site error: {e}")
        return jsonify({'error': 'Failed to create site'}), 500

@api_bp.route('/sites/<int:site_id>', methods=['PUT'])
@require_auth
@require_role(UserRole.ADMIN.value, UserRole.MEISTER.value)
def update_site(site_id):
    """Job Site aktualisieren"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            site = session.query(JobSite).filter(JobSite.id == site_id).first()
            if not site:
                return jsonify({'error': 'Site not found'}), 404
            
            # Erlaubte Felder für Update
            allowed_fields = ['name', 'address', 'latitude', 'longitude', 'factory_number', 'project_number', 'order_number', 'is_active']
            for field in allowed_fields:
                if field in data:
                    setattr(site, field, data[field])
            
            session.commit()
            
            logger.info(f"Job site updated by {user.username}: {site.name}")
            
            return jsonify({
                'success': True,
                'site': {
                    'id': site.id,
                    'name': site.name,
                    'address': site.address
                }
            })
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Update site error: {e}")
        return jsonify({'error': 'Failed to update site'}), 500

@api_bp.route('/sites/<int:site_id>', methods=['DELETE'])
@require_auth
@require_role(UserRole.ADMIN.value)
def delete_site(site_id):
    """Job Site löschen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            site = session.query(JobSite).filter(JobSite.id == site_id).first()
            if not site:
                return jsonify({'error': 'Site not found'}), 404
            
            # Soft delete - setze is_active auf False
            site.is_active = False
            session.commit()
            
            logger.info(f"Job site deleted by {user.username}: {site.name}")
            
            return jsonify({'success': True})
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Delete site error: {e}")
        return jsonify({'error': 'Failed to delete site'}), 500

# Abwesenheitsverwaltung Endpoints
@api_bp.route('/absences', methods=['POST'])
@require_auth
def create_absence_request():
    """Abwesenheitsantrag erstellen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Pflichtfelder prüfen
        required_fields = ['absence_type', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Datum validieren
        start_date = datetime.fromisoformat(data['start_date'])
        end_date = datetime.fromisoformat(data['end_date'])
        
        if start_date >= end_date:
            return jsonify({'error': 'Start date must be before end date'}), 400
        
        # Prüfe Überschneidungen
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            overlapping = session.query(AbsenceRequest).filter(
                AbsenceRequest.user_id == user.id,
                AbsenceRequest.status.in_([AbsenceStatus.PENDING, AbsenceStatus.APPROVED]),
                AbsenceRequest.start_date <= end_date,
                AbsenceRequest.end_date >= start_date
            ).first()
            
            if overlapping:
                return jsonify({'error': 'Overlapping absence request exists'}), 400
        finally:
            db_manager.close_session(session)
        
        # AbsenceRequest erstellen
        absence_request = AbsenceRequest(
            user_id=user.id,
            absence_type=AbsenceType(data['absence_type']),
            start_date=start_date,
            end_date=end_date,
            reason=data.get('reason', ''),
            status=AbsenceStatus.PENDING
        )
        
        session = db_manager.get_session()
        try:
            session.add(absence_request)
            session.commit()
            session.refresh(absence_request)
        finally:
            db_manager.close_session(session)
        
        logger.info(f"Absence request created by {user.username}")
        
        return jsonify({
            'success': True,
            'absence_request': {
                'id': absence_request.id,
                'status': absence_request.status.value
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Create absence request error: {e}")
        return jsonify({'error': 'Failed to create absence request'}), 500

@api_bp.route('/absences', methods=['GET'])
@require_auth
def get_absence_requests():
    """Abwesenheitsanträge abrufen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Filter-Parameter
        status_filter = request.args.get('status')
        absence_type_filter = request.args.get('absence_type')
        
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            query = session.query(AbsenceRequest).filter(AbsenceRequest.user_id == user.id)
            
            if status_filter:
                query = query.filter(AbsenceRequest.status == AbsenceStatus(status_filter))
            
            if absence_type_filter:
                query = query.filter(AbsenceRequest.absence_type == AbsenceType(absence_type_filter))
            
            absence_requests = query.order_by(AbsenceRequest.start_date.desc()).all()
            
            requests_data = []
            for req in absence_requests:
                requests_data.append({
                    'id': req.id,
                    'absence_type': req.absence_type.value,
                    'start_date': req.start_date.isoformat(),
                    'end_date': req.end_date.isoformat(),
                    'reason': req.reason,
                    'status': req.status.value,
                    'approved_by': req.approved_by,
                    'approved_at': req.approved_at.isoformat() if req.approved_at else None,
                    'rejection_reason': req.rejection_reason,
                    'created_at': req.created_at.isoformat()
                })
            
            return jsonify({
                'success': True,
                'absence_requests': requests_data
            })
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Get absence requests error: {e}")
        return jsonify({'error': 'Failed to get absence requests'}), 500

@api_bp.route('/absences/<int:absence_id>/approve', methods=['POST'])
@require_auth
@require_role(UserRole.MEISTER.value, UserRole.ADMIN.value)
def approve_absence_request(absence_id):
    """Abwesenheitsantrag genehmigen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            absence_request = session.query(AbsenceRequest).filter(AbsenceRequest.id == absence_id).first()
            if not absence_request:
                return jsonify({'error': 'Absence request not found'}), 404
            
            if absence_request.status != AbsenceStatus.PENDING:
                return jsonify({'error': 'Request not pending for approval'}), 400
            
            absence_request.status = AbsenceStatus.APPROVED
            absence_request.approved_by = user.id
            absence_request.approved_at = datetime.utcnow()
            
            session.commit()
            
            logger.info(f"Absence request {absence_id} approved by {user.username}")
            
            return jsonify({'success': True})
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Approve absence request error: {e}")
        return jsonify({'error': 'Failed to approve absence request'}), 500

@api_bp.route('/absences/<int:absence_id>/reject', methods=['POST'])
@require_auth
@require_role(UserRole.MEISTER.value, UserRole.ADMIN.value)
def reject_absence_request(absence_id):
    """Abwesenheitsantrag ablehnen"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        reason = data.get('reason', '')
        
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            absence_request = session.query(AbsenceRequest).filter(AbsenceRequest.id == absence_id).first()
            if not absence_request:
                return jsonify({'error': 'Absence request not found'}), 404
            
            if absence_request.status != AbsenceStatus.PENDING:
                return jsonify({'error': 'Request not pending for approval'}), 400
            
            absence_request.status = AbsenceStatus.REJECTED
            absence_request.approved_by = user.id
            absence_request.approved_at = datetime.utcnow()
            absence_request.rejection_reason = reason
            
            session.commit()
            
            logger.info(f"Absence request {absence_id} rejected by {user.username}")
            
            return jsonify({'success': True})
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Reject absence request error: {e}")
        return jsonify({'error': 'Failed to reject absence request'}), 500

# Dashboard Endpoints
@api_bp.route('/dashboard/stats', methods=['GET'])
@require_auth
def get_dashboard_stats():
    """Dashboard Statistiken"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Heutige Statistiken
        today = datetime.utcnow().date()
        today_records = time_record_service.get_by_user_and_date(user.id, today)
        
        today_hours = 0
        for record in today_records:
            if record.clock_out:
                hours = (record.clock_out - record.clock_in).total_seconds() / 3600
                hours -= record.total_break_minutes / 60
                today_hours += hours
        
        # Wöchentliche Statistiken
        week_start = today - timedelta(days=today.weekday())
        week_records = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            day_records = time_record_service.get_by_user_and_date(user.id, day)
            week_records.extend(day_records)
        
        week_hours = 0
        for record in week_records:
            if record.clock_out:
                hours = (record.clock_out - record.clock_in).total_seconds() / 3600
                hours -= record.total_break_minutes / 60
                week_hours += hours
        
        # System-weite Statistiken (nur für Admin)
        system_stats = {}
        if user.role == UserRole.ADMIN:
            from services.crud_service import db_manager
            session = db_manager.get_session()
            try:
                total_users = session.query(User).count()
                active_sessions = session.query(TimeRecord).filter(
                    TimeRecord.status == TimeRecordStatus.ACTIVE
                ).count()
                today_clock_ins = session.query(TimeRecord).filter(
                    TimeRecord.clock_in >= today
                ).count()
                today_reports = session.query(WorkReport).filter(
                    WorkReport.created_at >= today
                ).count()
                today_approvals = session.query(WorkReport).filter(
                    WorkReport.approved_at >= today
                ).count()
                
                system_stats = {
                    'total_users': total_users,
                    'active_sessions': active_sessions,
                    'today_clock_ins': today_clock_ins,
                    'today_reports': today_reports,
                    'today_approvals': today_approvals
                }
            finally:
                db_manager.close_session(session)
        
        return jsonify({
            'success': True,
            'stats': {
                'today_hours': round(today_hours, 2),
                'week_hours': round(week_hours, 2),
                'today_units': 0,  # TODO: Implement units calculation
                **system_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Get dashboard stats error: {e}")
        return jsonify({'error': 'Failed to get dashboard stats'}), 500

@api_bp.route('/dashboard/pending-approvals', methods=['GET'])
@require_auth
@require_role(UserRole.MEISTER.value, UserRole.ADMIN.value)
def get_pending_approvals():
    """Ausstehende Freigaben"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        pending_reports = work_report_service.get_pending_approvals(user.id)
        
        approvals_data = []
        for report in pending_reports:
            approvals_data.append({
                'id': report.id,
                'user_name': report.user.name,
                'date': report.date.strftime('%Y-%m-%d'),
                'units': report.units,
                'task_type': report.task_type,
                'job_site': report.job_site.name if report.job_site else 'Unbekannt'
            })
        
        return jsonify({
            'success': True,
            'approvals': approvals_data
        })
        
    except Exception as e:
        logger.error(f"Get pending approvals error: {e}")
        return jsonify({'error': 'Failed to get pending approvals'}), 500

@api_bp.route('/dashboard/team-status', methods=['GET'])
@require_auth
@require_role(UserRole.MEISTER.value, UserRole.ADMIN.value)
def get_team_status():
    """Team-Status"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Hole alle aktiven Benutzer
        from services.crud_service import db_manager
        session = db_manager.get_session()
        try:
            team_members = session.query(User).filter(
                User.is_active == True,
                User.role.in_([UserRole.MONTEUR, UserRole.BUERO])
            ).all()
            
            team_data = []
            for member in team_members:
                # Aktive TimeRecord
                active_record = time_record_service.get_active_by_user(member.id)
                
                # Heutige Stunden
                today = datetime.utcnow().date()
                today_records = time_record_service.get_by_user_and_date(member.id, today)
                
                today_hours = 0
                for record in today_records:
                    if record.clock_out:
                        hours = (record.clock_out - record.clock_in).total_seconds() / 3600
                        hours -= record.total_break_minutes / 60
                        today_hours += hours
                
                team_data.append({
                    'id': member.id,
                    'name': member.name,
                    'status': 'Eingestempelt' if active_record else 'Ausgestempelt',
                    'hours': round(today_hours, 1),
                    'location': 'Unbekannt'  # TODO: Implement location tracking
                })
            
            return jsonify({
                'success': True,
                'team': team_data
            })
        finally:
            db_manager.close_session(session)
        
    except Exception as e:
        logger.error(f"Get team status error: {e}")
        return jsonify({'error': 'Failed to get team status'}), 500 
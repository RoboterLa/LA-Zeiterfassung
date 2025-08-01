from flask import Blueprint, request, jsonify, session
from typing import Dict, Any
from backend.services.crud_service import (
    AuftraegeService, 
    ZeiterfassungService, 
    ArbeitszeitService, 
    UrlaubService
)
from backend.utils.auth import requires_role, is_authenticated

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
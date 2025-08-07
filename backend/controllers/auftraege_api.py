from flask import Blueprint, request, jsonify, session
from datetime import datetime
from services.order_service import OrderService
from models.database import get_db, User
import logging

logger = logging.getLogger(__name__)

auftraege_bp = Blueprint('auftraege', __name__, url_prefix='/api/auftraege')

def get_current_user_id():
    """Aktuelle Benutzer-ID aus Session abrufen"""
    if 'user' not in session:
        return None
    return session['user'].get('id')

@auftraege_bp.route('/orders', methods=['GET'])
def get_orders():
    """Alle Aufträge des aktuellen Benutzers abrufen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        db = next(get_db())
        orders = OrderService.get_orders(db, user_id)
        
        return jsonify({
            'success': True,
            'orders': [order.to_dict() for order in orders]
        })
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        return jsonify({'error': 'Fehler beim Laden der Aufträge'}), 500

@auftraege_bp.route('/order', methods=['POST'])
def create_order():
    """Neuen Auftrag erstellen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        data = request.get_json()
        required_fields = ['order_number', 'location', 'factory_number', 'activity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Feld {field} ist erforderlich'}), 400
        
        db = next(get_db())
        order = OrderService.create_order(
            db=db,
            user_id=user_id,
            order_number=data['order_number'],
            location=data['location'],
            factory_number=data['factory_number'],
            activity=data['activity'],
            description=data.get('description', ''),
            status='active'
        )
        
        return jsonify({
            'success': True,
            'message': 'Auftrag erfolgreich erstellt',
            'order': order.to_dict()
        })
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        return jsonify({'error': 'Fehler beim Erstellen des Auftrags'}), 500

@auftraege_bp.route('/daily-reports', methods=['GET'])
def get_daily_reports():
    """Alle Tagesberichte des aktuellen Benutzers abrufen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        db = next(get_db())
        daily_reports = OrderService.get_daily_reports(db, user_id)
        
        return jsonify({
            'success': True,
            'daily_reports': [report.to_dict() for report in daily_reports]
        })
    except Exception as e:
        logger.error(f"Error fetching daily reports: {e}")
        return jsonify({'error': 'Fehler beim Laden der Tagesberichte'}), 500

@auftraege_bp.route('/daily-report', methods=['POST'])
def create_daily_report():
    """Neuen Tagesbericht erstellen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        data = request.get_json()
        required_fields = ['report_date', 'location', 'factory_number', 'activity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Feld {field} ist erforderlich'}), 400
        
        db = next(get_db())
        daily_report = OrderService.create_daily_report(
            db=db,
            user_id=user_id,
            report_date=data['report_date'],
            location=data['location'],
            factory_number=data['factory_number'],
            activity=data['activity'],
            performance_unit=data.get('performance_unit', 0.0),
            emergency_service=data.get('emergency_service', False),
            order_number=data.get('order_number', ''),
            free_text=data.get('free_text', ''),
            status='pending'
        )
        
        return jsonify({
            'success': True,
            'message': 'Tagesbericht erfolgreich erstellt',
            'daily_report': daily_report.to_dict()
        })
    except Exception as e:
        logger.error(f"Error creating daily report: {e}")
        return jsonify({'error': 'Fehler beim Erstellen des Tagesberichts'}), 500

@auftraege_bp.route('/summary', methods=['GET'])
def get_orders_summary():
    """Auftrags-Zusammenfassung abrufen"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Nicht angemeldet'}), 401
        
        db = next(get_db())
        
        # Aufträge zählen
        orders = OrderService.get_orders(db, user_id)
        active_orders = [order for order in orders if order.status == 'active']
        completed_orders = [order for order in orders if order.status == 'completed']
        
        # Tagesberichte zählen
        daily_reports = OrderService.get_daily_reports(db, user_id)
        pending_reports = [report for report in daily_reports if report.status == 'pending']
        approved_reports = [report for report in daily_reports if report.status == 'approved']
        
        return jsonify({
            'success': True,
            'summary': {
                'total_orders': len(orders),
                'active_orders': len(active_orders),
                'completed_orders': len(completed_orders),
                'total_daily_reports': len(daily_reports),
                'pending_reports': len(pending_reports),
                'approved_reports': len(approved_reports)
            }
        })
    except Exception as e:
        logger.error(f"Error fetching orders summary: {e}")
        return jsonify({'error': 'Fehler beim Laden der Zusammenfassung'}), 500

from flask import Blueprint, request, jsonify, session
from backend.models.buero_time_tracking import BueroTimeTrackingService
from backend.models.daily_reports import DailyReportService
from backend.models.vacation_management import VacationService
from backend.models.order_management import OrderService
from backend.models.reports_exports import ReportService
from backend.utils.security import require_auth, require_permission
from backend.models.user import UserService

# Blueprint für neue Module
modules_bp = Blueprint('modules', __name__, url_prefix='/api/modules')

# Büroangestellte Time Tracking
@modules_bp.route('/buero/clock-in', methods=['POST'])
@require_auth
@require_permission('time_entry')
def buero_clock_in():
    """Büro-Einstempeln"""
    data = request.get_json()
    location = data.get('location', 'Büro')
    
    user = UserService.get_user_by_email(session['user']['email'])
    result = BueroTimeTrackingService.clock_in_office(user.id, location)
    
    return jsonify(result)

@modules_bp.route('/buero/clock-out', methods=['POST'])
@require_auth
@require_permission('time_entry')
def buero_clock_out():
    """Büro-Ausstempeln"""
    data = request.get_json()
    notes = data.get('notes', '')
    
    user = UserService.get_user_by_email(session['user']['email'])
    result = BueroTimeTrackingService.clock_out_office(user.id, notes)
    
    return jsonify(result)

@modules_bp.route('/buero/monthly-summary/<int:year>/<int:month>')
@require_auth
@require_permission('reports_view')
def buero_monthly_summary(year, month):
    """Monatsübersicht Büroangestellte"""
    user = UserService.get_user_by_email(session['user']['email'])
    summary = BueroTimeTrackingService.get_monthly_summary(user.id, year, month)
    
    return jsonify(summary)

# Daily Reports & Premium Pay
@modules_bp.route('/daily-reports/create', methods=['POST'])
@require_auth
@require_permission('daily_reports_create')
def create_daily_report():
    """Tagesbericht erstellen"""
    data = request.get_json()
    
    user = UserService.get_user_by_email(session['user']['email'])
    result = DailyReportService.create_daily_report(
        user.id,
        data.get('date'),
        data.get('work_description'),
        float(data.get('hours_worked', 0)),
        data.get('materials_used', ''),
        data.get('problems', '')
    )
    
    return jsonify(result)

@modules_bp.route('/daily-reports/pending')
@require_auth
@require_permission('daily_reports_approval')
def get_pending_reports():
    """Ausstehende Tagesberichte (für Meister)"""
    reports = DailyReportService.get_pending_reports()
    return jsonify({'reports': reports})

@modules_bp.route('/daily-reports/<int:report_id>/approve', methods=['POST'])
@require_auth
@require_permission('daily_reports_approval')
def approve_daily_report(report_id):
    """Tagesbericht genehmigen/ablehnen"""
    data = request.get_json()
    approver = UserService.get_user_by_email(session['user']['email'])
    
    result = DailyReportService.approve_report(
        report_id,
        approver.id,
        data.get('approved', False),
        data.get('comment', '')
    )
    
    return jsonify(result)

@modules_bp.route('/premium-pay/<int:year>/<int:month>')
@require_auth
@require_permission('payroll_data_access')
def get_premium_pay_report(year, month):
    """Prämienlohn-Bericht"""
    user = UserService.get_user_by_email(session['user']['email'])
    report = DailyReportService.calculate_premium_pay(user.id, month, year)
    
    return jsonify(report)

# Vacation Management
@modules_bp.route('/vacation/request', methods=['POST'])
@require_auth
def create_vacation_request():
    """Urlaubs-/Krankheitsantrag erstellen"""
    data = request.get_json()
    
    user = UserService.get_user_by_email(session['user']['email'])
    result = VacationService.create_vacation_request(
        user.id,
        data.get('start_date'),
        data.get('end_date'),
        data.get('vacation_type'),
        data.get('reason', '')
    )
    
    return jsonify(result)

@modules_bp.route('/vacation/available-days/<int:year>')
@require_auth
def get_available_vacation_days(year):
    """Verfügbare Urlaubs-/Krankheitstage"""
    user = UserService.get_user_by_email(session['user']['email'])
    available = VacationService.get_available_days(user.id, year)
    
    return jsonify(available)

@modules_bp.route('/vacation/pending')
@require_auth
@require_permission('time_approval')
def get_pending_vacation_requests():
    """Ausstehende Urlaubs-/Krankheitsanträge"""
    requests = VacationService.get_pending_requests()
    return jsonify({'requests': requests})

@modules_bp.route('/vacation/<int:request_id>/approve', methods=['POST'])
@require_auth
@require_permission('time_approval')
def approve_vacation_request(request_id):
    """Urlaubs-/Krankheitsantrag genehmigen/ablehnen"""
    data = request.get_json()
    approver = UserService.get_user_by_email(session['user']['email'])
    
    result = VacationService.approve_vacation_request(
        request_id,
        approver.id,
        data.get('approved', False),
        data.get('comment', '')
    )
    
    return jsonify(result)

@modules_bp.route('/vacation/calendar/<int:year>/<int:month>')
@require_auth
@require_permission('reports_view')
def get_vacation_calendar(year, month):
    """Kalenderansicht für Urlaub"""
    calendar = VacationService.get_calendar_view(year, month)
    return jsonify(calendar)

# Order Management
@modules_bp.route('/orders', methods=['GET'])
@require_auth
@require_permission('order_view')
def get_orders():
    """Alle Aufträge mit Filtern"""
    filters = request.args.to_dict()
    orders = OrderService.get_all_orders(filters)
    return jsonify({'orders': orders})

@modules_bp.route('/orders/map')
@require_auth
@require_permission('order_view')
def get_orders_for_map():
    """Aufträge für Kartenansicht"""
    bounds = request.args.to_dict()
    orders = OrderService.get_orders_for_map(bounds)
    return jsonify({'orders': orders})

@modules_bp.route('/orders', methods=['POST'])
@require_auth
@require_permission('order_management')
def create_order():
    """Neuen Auftrag erstellen"""
    data = request.get_json()
    
    result = OrderService.create_order(
        data.get('art'),
        data.get('uhrzeit'),
        data.get('standort'),
        data.get('coords', ''),
        data.get('details', ''),
        data.get('priority', 'normal')
    )
    
    return jsonify(result)

@modules_bp.route('/orders/<int:order_id>/assign', methods=['POST'])
@require_auth
@require_permission('order_management')
def assign_order(order_id):
    """Auftrag Mitarbeiter zuweisen"""
    data = request.get_json()
    
    result = OrderService.assign_order_to_employee(
        order_id,
        data.get('mitarbeiter', '')
    )
    
    return jsonify(result)

@modules_bp.route('/orders/<int:order_id>/done', methods=['POST'])
@require_auth
@require_permission('order_management')
def mark_order_done(order_id):
    """Auftrag als erledigt markieren"""
    result = OrderService.mark_order_done(order_id)
    return jsonify(result)

@modules_bp.route('/orders/statistics')
@require_auth
@require_permission('reports_view')
def get_order_statistics():
    """Auftrags-Statistiken"""
    stats = OrderService.get_order_statistics()
    return jsonify(stats)

@modules_bp.route('/orders/search')
@require_auth
@require_permission('order_view')
def search_orders():
    """Aufträge suchen"""
    search_term = request.args.get('q', '')
    orders = OrderService.search_orders(search_term)
    return jsonify({'orders': orders})

@modules_bp.route('/orders/<int:order_id>/navigation')
@require_auth
@require_permission('order_view')
def get_order_navigation(order_id):
    """Navigationslink für Auftrag"""
    nav = OrderService.get_navigation_link(order_id)
    return jsonify(nav)

# Reports & Exports
@modules_bp.route('/reports/monthly/<int:year>/<int:month>')
@require_auth
@require_permission('reports_view')
def get_monthly_report(year, month):
    """Monatsbericht"""
    report = ReportService.generate_monthly_report(year, month)
    return jsonify(report)

@modules_bp.route('/reports/premium-pay/<int:year>/<int:month>')
@require_auth
@require_permission('payroll_data_access')
def get_premium_pay_report(year, month):
    """Prämienlohn-Bericht"""
    report = ReportService.calculate_premium_pay_report(year, month)
    return jsonify(report)

@modules_bp.route('/reports/dashboard')
@require_auth
@require_permission('reports_view')
def get_management_dashboard():
    """Management-Dashboard"""
    dashboard = ReportService.generate_management_dashboard()
    return jsonify(dashboard)

@modules_bp.route('/exports/time-entries/<int:year>/<int:month>')
@require_auth
@require_permission('reports_export')
def export_time_entries_csv(year, month):
    """Zeiteinträge als CSV exportieren"""
    csv_data = ReportService.export_time_entries_csv(year, month)
    
    from flask import Response
    response = Response(csv_data, mimetype='text/csv')
    response.headers['Content-Disposition'] = f'attachment; filename=zeiteintraege_{year}_{month:02d}.csv'
    
    return response

@modules_bp.route('/exports/payroll/<int:year>/<int:month>')
@require_auth
@require_permission('reports_export')
def export_payroll_csv(year, month):
    """Gehaltsabrechnung als CSV exportieren"""
    csv_data = ReportService.export_payroll_csv(year, month)
    
    from flask import Response
    response = Response(csv_data, mimetype='text/csv')
    response.headers['Content-Disposition'] = f'attachment; filename=gehaltsabrechnung_{year}_{month:02d}.csv'
    
    return response

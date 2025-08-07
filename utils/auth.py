from functools import wraps
from flask import session, jsonify
from typing import Callable, Any

def requires_role(role: str) -> Callable:
    """Decorator für Rollen-basierte Authentifizierung"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            if 'user' not in session:
                return jsonify({'error': 'Nicht angemeldet'}), 401
            
            user_role = session['user'].get('role')
            if user_role != role and user_role != 'Admin':
                return jsonify({'error': 'Keine Berechtigung'}), 403
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def get_current_user() -> dict:
    """Gibt den aktuellen Benutzer aus der Session zurück"""
    return session.get('user', {})

def is_authenticated() -> bool:
    """Prüft ob der Benutzer angemeldet ist"""
    return 'user' in session

def is_admin() -> bool:
    """Prüft ob der Benutzer Admin-Rechte hat"""
    user = get_current_user()
    return user.get('role') == 'Admin' 
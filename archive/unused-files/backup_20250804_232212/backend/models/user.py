from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import hashlib
import sqlite3
from utils.db import get_db_connection

class UserRole(Enum):
    """Benutzerrollen im System"""
    ADMIN = "Admin"
    MEISTER = "Meister"
    MONTEUR = "Monteur"
    BUERO = "Büroangestellte"
    LOHNBUCHHALTER = "Lohnbuchhalter"

@dataclass
class User:
    """Benutzer-Modell"""
    id: Optional[int]
    email: str
    name: str
    role: UserRole
    password_hash: str
    created_at: str
    
    @classmethod
    def create(cls, email: str, name: str, role: UserRole, password: str) -> 'User':
        """Erstellt einen neuen Benutzer"""
        password_hash = cls._hash_password(password)
        return cls(
            id=None,
            email=email,
            name=name,
            role=role,
            password_hash=password_hash,
            created_at=""
        )
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash-Passwort mit Salt"""
        salt = "zeiterfassung_salt_2024"
        return hashlib.sha256((password + salt).encode()).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        """Überprüft das Passwort"""
        return self.password_hash == self._hash_password(password)
    
    def has_permission(self, permission: str) -> bool:
        """Überprüft Berechtigungen basierend auf Rolle"""
        permissions = ROLE_PERMISSIONS.get(self.role, set())
        return permission in permissions
    
    def to_dict(self) -> Dict:
        """Konvertiert User zu Dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role.value,
            'created_at': self.created_at
        }

# Rollenberechtigungen
ROLE_PERMISSIONS = {
    UserRole.ADMIN: {
        'user_management',
        'time_approval',
        'reports_view',
        'reports_export',
        'system_settings',
        'all_data_access'
    },
    UserRole.MEISTER: {
        'time_approval',
        'reports_view',
        'team_management',
        'order_management',
        'daily_reports_approval'
    },
    UserRole.MONTEUR: {
        'time_entry',
        'order_view',
        'daily_reports_create',
        'own_data_access'
    },
    UserRole.BUERO: {
        'time_entry',
        'reports_view',
        'order_management',
        'basic_data_access'
    },
    UserRole.LOHNBUCHHALTER: {
        'reports_view',
        'reports_export',
        'payroll_data_access',
        'salary_calculations'
    }
}

class UserService:
    """Service für Benutzerverwaltung"""
    
    @staticmethod
    def create_user(user: User) -> User:
        """Erstellt einen neuen Benutzer in der Datenbank"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO users (email, password_hash, name, role)
            VALUES (?, ?, ?, ?)
        ''', (user.email, user.password_hash, user.name, user.role.value))
        
        user.id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return user
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Holt Benutzer nach E-Mail"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(
                id=row['id'],
                email=row['email'],
                name=row['name'],
                role=UserRole(row['role']),
                password_hash=row['password_hash'],
                created_at=row['created_at']
            )
        return None
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """Holt Benutzer nach ID"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return User(
                id=row['id'],
                email=row['email'],
                name=row['name'],
                role=UserRole(row['role']),
                password_hash=row['password_hash'],
                created_at=row['created_at']
            )
        return None
    
    @staticmethod
    def get_all_users() -> List[User]:
        """Holt alle Benutzer"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users ORDER BY name')
        rows = cursor.fetchall()
        conn.close()
        
        return [
            User(
                id=row['id'],
                email=row['email'],
                name=row['name'],
                role=UserRole(row['role']),
                password_hash=row['password_hash'],
                created_at=row['created_at']
            )
            for row in rows
        ]
    
    @staticmethod
    def update_user(user: User) -> bool:
        """Aktualisiert einen Benutzer"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users 
            SET email = ?, name = ?, role = ?
            WHERE id = ?
        ''', (user.email, user.name, user.role.value, user.id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return success
    
    @staticmethod
    def delete_user(user_id: int) -> bool:
        """Löscht einen Benutzer"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return success
    
    @staticmethod
    def create_demo_users() -> List[User]:
        """Erstellt Demo-Benutzer für alle Rollen"""
        demo_users = [
            User.create("admin@test.com", "System Administrator", UserRole.ADMIN, "admin123"),
            User.create("meister@test.com", "Hans Meister", UserRole.MEISTER, "meister123"),
            User.create("monteur1@test.com", "Max Monteur", UserRole.MONTEUR, "monteur123"),
            User.create("monteur2@test.com", "Anna Monteur", UserRole.MONTEUR, "monteur123"),
            User.create("buero@test.com", "Lisa Büro", UserRole.BUERO, "buero123"),
            User.create("lohn@test.com", "Peter Lohnbuchhalter", UserRole.LOHNBUCHHALTER, "lohn123")
        ]
        
        created_users = []
        for user in demo_users:
            # Prüfe ob Benutzer bereits existiert
            existing = UserService.get_user_by_email(user.email)
            if not existing:
                created_user = UserService.create_user(user)
                created_users.append(created_user)
            else:
                created_users.append(existing)
        
        return created_users

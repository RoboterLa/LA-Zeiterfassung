from backend.models.database import Base, engine, SessionLocal, User
import bcrypt
from datetime import datetime

def hash_password(password: str) -> str:
    """Passwort hashen"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_database():
    """Datenbank und Tabellen erstellen"""
    print("🗄️ Erstelle Datenbank und Tabellen...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tabellen erstellt!")
    
    # Test-Users erstellen
    print("👥 Erstelle Test-Users...")
    db = SessionLocal()
    
    try:
        # Prüfe ob Users bereits existieren
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("ℹ️ Users bereits vorhanden, überspringe...")
            return
        
        # Erstelle Test-Users
        test_users = [
            {
                'email': 'admin',
                'password': 'admin123',
                'name': 'Administrator',
                'role': 'Admin'
            },
            {
                'email': 'monteur',
                'password': 'monteur123',
                'name': 'Max Mustermann',
                'role': 'Monteur'
            },
            {
                'email': 'buero',
                'password': 'buero123',
                'name': 'Anna Büro',
                'role': 'Büro'
            },
            {
                'email': 'lohn',
                'password': 'lohn123',
                'name': 'Peter Lohn',
                'role': 'Lohn'
            }
        ]
        
        for user_data in test_users:
            user = User(
                email=user_data['email'],
                password_hash=hash_password(user_data['password']),
                name=user_data['name'],
                role=user_data['role'],
                is_active=True
            )
            db.add(user)
        
        db.commit()
        print("✅ Test-Users erstellt!")
        
    except Exception as e:
        print(f"❌ Fehler beim Erstellen der Users: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    create_database()

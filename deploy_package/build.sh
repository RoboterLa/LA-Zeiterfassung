#!/bin/bash
echo "🔧 Installiere Python Dependencies..."
pip install -r requirements.txt

echo "📁 Erstelle notwendige Verzeichnisse..."
mkdir -p sessions
mkdir -p instance

echo "🗄️ Initialisiere Datenbank..."
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Datenbank erfolgreich initialisiert')
"

echo "✅ Build abgeschlossen"

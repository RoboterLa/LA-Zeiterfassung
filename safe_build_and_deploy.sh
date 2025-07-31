#!/bin/bash
set -euo pipefail

# ---- Konfiguration: Cursor muss diese Werte setzen oder bestätigen ----
RESOURCE_GROUP="${RESOURCE_GROUP:-la-zeiterfassung-rg}"
WEBAPP_NAME="${WEBAPP_NAME:-la-zeiterfassung-fyd4cge3d9e3cac4}"
# Gunicorn-Entry; prüfen, ob der Pfad stimmt (app.py exportiert app-Objekt)
STARTUP_CMD="${STARTUP_CMD:-gunicorn app:app --workers 4}"
# Erwartete Python-Version (nur zur Warnung)
EXPECTED_PYTHON="3.11"

# Falls ihr App Settings setzen wollt; als "KEY=VALUE" Einträge
EXTRA_APP_SETTINGS=(
    "FLASK_ENV=production"
    "SCM_DO_BUILD_DURING_DEPLOYMENT=true"
    "PYTHON_VERSION=3.11"
)

# Sicherheitsmechanismus: ohne explizite Bestätigung (CONFIRM=yes) bricht ab, wenn Warnungen auftreten
CONFIRM="${CONFIRM:-no}"  # setze auf "yes" um bei Warnungen trotzdem weiterzugehen

# ---- Hilfsfunktionen ----
warn() { echo -e "\e[33mWARN:\e[0m $*"; }
info() { echo -e "\e[32mINFO:\e[0m $*"; }
fail() { echo -e "\e[31mERROR:\e[0m $*"; exit 1; }

# ---- 1. Basis-Prüfungen ----
errors=0
warnings=0

if [[ -z "$RESOURCE_GROUP" ]]; then
  fail "RESOURCE_GROUP ist nicht gesetzt. Cursor muss den Namen der Azure Resource Group eintragen."
fi
if [[ -z "$WEBAPP_NAME" ]]; then
  fail "WEBAPP_NAME ist nicht gesetzt. Cursor muss den Namen der Azure Web App eintragen."
fi

info "Prüfe, ob notwendige Dateien existieren..."

# Entry point prüfen
ENTRY_MODULE=""
if [[ -f "app.py" ]]; then
  ENTRY_MODULE="app:app"
  info "✅ Gefunden: app.py als WSGI-Einstiegspunkt"
elif [[ -f "backend/app.py" ]]; then
  warn "Gefunden: backend/app.py – ist der WSGI-Einstiegspunkt dort? (Wenn ja, sollte STARTUP_CMD z.B. 'gunicorn backend.app:app' sein.)"
  ENTRY_MODULE="backend.app:app"
else
  fail "Kein offensichtlicher Einstiegspunkt (weder app.py noch backend/app.py) gefunden."
fi

# requirements.txt prüfen
if [[ ! -f "requirements.txt" ]]; then
  warn "requirements.txt fehlt. Deployment könnte fehlschlagen, wenn Abhängigkeiten nicht installiert sind."
  ((warnings++))
else
  info "✅ requirements.txt gefunden"
fi

# Frontend prüfen
if [[ -d "frontend" ]]; then
  if [[ ! -f "frontend/package.json" ]]; then
    warn "frontend/ exists, aber package.json fehlt. Ist das korrekt? Build könnte fehlschlagen."
    ((warnings++))
  else
    info "✅ frontend/package.json gefunden"
    if ! grep -q "\"build\"" frontend/package.json; then
      warn "In frontend/package.json scheint kein 'build'-Script definiert zu sein. Cursor prüfen: Wie wird das Frontend gebaut?" 
      ((warnings++))
    else
      info "✅ build-Script in package.json gefunden"
    fi
  fi
else
  warn "Kein 'frontend'-Verzeichnis gefunden. Wenn die App statische Dateien erwartet, könnte das fehlen." 
  ((warnings++))
fi

# Gunicorn-Import testen (falls Python verfügbar ist)
if command -v python3 >/dev/null 2>&1; then
  info "Teste, ob das Entry-Objekt importiert werden kann (lokal, zur Kontrolle)..."
  set +e
  python3 - <<PYTHON_TEST
import sys
try:
    module, attr = "${STARTUP_CMD%% *}".split(':') if ':' in "${STARTUP_CMD%% *}" else ("app","app")
    __import__(module)
    mod = sys.modules[module]
    if not hasattr(mod, attr if ':' in "${STARTUP_CMD%% *}" else "app"):
        print("MISSING_ATTR")
    else:
        print("OK")
except Exception as e:
    print("IMPORT_ERROR", e)
PYTHON_TEST
  rc=$?
  set -e
  if [[ $rc -ne 0 ]]; then
    warn "Beim Test-Import des Entry-Punktes gab es Probleme. Cursor sollte bestätigen, dass '${STARTUP_CMD}' korrekt ist."; ((warnings++))
  else
    info "✅ Entry-Punkt Import-Test erfolgreich"
  fi
else
  warn "Python3 ist nicht installiert oder nicht im PATH. Kann Import nicht testen."
  ((warnings++))
fi

# ---- 2. Zusammenfassung der Prüfungen ----
echo "---- Prüfungsübersicht ----"
echo "Resource Group: $RESOURCE_GROUP"
echo "WebApp Name: $WEBAPP_NAME"
echo "Startup Command (aktuell): $STARTUP_CMD"
echo "Frontend vorhanden: $( [[ -d frontend ]] && echo yes || echo no )"
echo "requirements.txt vorhanden: $( [[ -f requirements.txt ]] && echo yes || echo no )"
echo "Extra App Settings: ${EXTRA_APP_SETTINGS[*]:- (keine)}"
echo "Confirm-Flag: $CONFIRM"
echo "Warnings: $warnings"
echo "Errors so weit: $errors"
echo "--------------------------"

# Wenn es Warnungen gibt und keine explizite Bestätigung, abbrechen
if [[ $warnings -gt 0 && "$CONFIRM" != "yes" ]]; then
  warn "Es gibt Warnungen. Um trotzdem weiterzumachen, setze CONFIRM=yes in der Umgebung (z.B. export CONFIRM=yes) und führe erneut aus."
  exit 1
fi

# ---- 3. Frontend bauen (wenn vorhanden) ----
if [[ -d "frontend" ]]; then
  info "Baue Frontend..."
  pushd frontend >/dev/null
  if command -v npm >/dev/null 2>&1; then
    info "Installiere Dependencies..."
    npm ci
    info "Baue React App..."
    if npm run build; then
      info "✅ Frontend-Build erfolgreich."
    else
      warn "Frontend-Build schlug fehl. Cursor muss prüfen: ist das build-Script korrekt definiert?"; ((warnings++))
    fi
  else
    fail "npm nicht gefunden. Cursor muss sicherstellen, dass Node.js/npm verfügbar ist."
  fi
  popd >/dev/null
fi

# ---- 4. Startup Command in Azure setzen ----
info "Setze Startup Command in Azure Web App auf: $STARTUP_CMD"
az webapp config set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEBAPP_NAME" \
  --startup-file "$STARTUP_CMD"

# ---- 5. Zusätzliche App Settings setzen ----
if [[ ${#EXTRA_APP_SETTINGS[@]} -gt 0 ]]; then
  info "Setze zusätzliche App Settings..."
  for kv in "${EXTRA_APP_SETTINGS[@]}"; do
    IFS='=' read -r key val <<< "$kv"
    if [[ -z "$key" || -z "$val" ]]; then
      warn "Ungültiges App Setting: '$kv' übersprungen."
      continue
    fi
    info "Setze: $key=$val"
    az webapp config appsettings set \
      --resource-group "$RESOURCE_GROUP" \
      --name "$WEBAPP_NAME" \
      --settings "$key=$val"
  done
fi

# ---- 6. ZIP-Paket bauen ----
ZIP_NAME="app.zip"
info "Erzeuge ZIP-Paket ($ZIP_NAME)..."
rm -f "$ZIP_NAME"

# Basisdateien
zip -r "$ZIP_NAME" app.py >/dev/null 2>&1 || true
if [[ -f "requirements.txt" ]]; then
  zip -r "$ZIP_NAME" requirements.txt >/dev/null
fi
if [[ -d "backend" ]]; then
  zip -r "$ZIP_NAME" backend >/dev/null
fi

# Frontend-Build korrekt einschließen
if [[ -d "frontend/build" ]]; then
  info "Füge frontend/build zum ZIP hinzu..."
  cd frontend
  zip -r "../$ZIP_NAME" build >/dev/null
  cd ..
else
  warn "frontend/build Verzeichnis nicht gefunden!"
fi

# Optional: weitere Ordner ergänzen, je nach Projekt
# zip -r "$ZIP_NAME" migrations >/dev/null

info "ZIP-Paket erstellt: Größe $(du -h "$ZIP_NAME" | cut -f1)"

# ---- 7. Deployment per ZIP ----
info "Deploye ZIP auf Azure Web App..."
az webapp deployment source config-zip \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEBAPP_NAME" \
  --src "$ZIP_NAME"

# ---- 8. Logs followen ----
info "Starte Log-Tailing (abbrechen mit Ctrl+C)..."
az webapp log tail --resource-group "$RESOURCE_GROUP" --name "$WEBAPP_NAME" 
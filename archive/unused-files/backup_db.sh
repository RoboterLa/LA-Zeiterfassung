#!/bin/bash

echo "💾 Datenbank-Backup vor Deployment"
echo "=================================="

# Backup erstellen
cp backend/zeiterfassung.db zeiterfassung_backup.db

echo "✅ Backup erstellt: zeiterfassung_backup.db"
echo "📊 Größe: $(du -h zeiterfassung_backup.db | cut -f1)"
echo ""
echo "⚠️  WICHTIG: Führen Sie dieses Script vor jedem Deployment aus!"
echo "   Azure überschreibt Dateien bei Upload - Backup schützt vor Datenverlust." 
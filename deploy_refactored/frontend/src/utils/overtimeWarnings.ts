export interface OvertimeWarning {
  date: string;
  totalHours: string;
  message: string;
}

export const checkOvertimeWarnings = async (): Promise<OvertimeWarning[]> => {
  try {
    // Lade Arbeitszeit-Daten vom Backend über die neue JSON-Route
    const response = await fetch('http://localhost:5001/api/arbeitszeit');
    const arbeitszeitData = await response.json();
    
    const warnings: OvertimeWarning[] = [];
    
    // Gruppiere nach Datum und prüfe auf Überstunden
    const dailyTotals = new Map<string, number>();
    
    arbeitszeitData.forEach((entry: any) => {
      if (entry.datum && entry.dauer) {
        const [hours, minutes] = entry.dauer.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        
        if (!dailyTotals.has(entry.datum)) {
          dailyTotals.set(entry.datum, 0);
        }
        dailyTotals.set(entry.datum, dailyTotals.get(entry.datum)! + totalMinutes);
      }
    });
    
    // Prüfe auf Überstunden (> 8.5 Stunden = 510 Minuten)
    dailyTotals.forEach((totalMinutes, date) => {
      if (totalMinutes > 510) { // 8.5 Stunden = 510 Minuten
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
        
        warnings.push({
          date: new Date(date).toLocaleDateString('de-DE'),
          totalHours,
          message: `Arbeitszeit überschritten: ${totalHours} Stunden`
        });
      }
    });
    
    return warnings;
  } catch (err) {
    console.error('Fehler beim Laden der Überstunden-Warnungen:', err);
    return [];
  }
};

// Speichere Warnungen im localStorage für globale Verfügbarkeit
export const saveOvertimeWarnings = (warnings: OvertimeWarning[]) => {
  localStorage.setItem('overtimeWarnings', JSON.stringify(warnings));
};

export const getOvertimeWarnings = (): OvertimeWarning[] => {
  try {
    const stored = localStorage.getItem('overtimeWarnings');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Aktualisiere Warnungen und speichere sie
export const updateOvertimeWarnings = async (): Promise<OvertimeWarning[]> => {
  const warnings = await checkOvertimeWarnings();
  saveOvertimeWarnings(warnings);
  return warnings;
}; 
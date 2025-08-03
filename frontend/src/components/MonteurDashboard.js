import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MonteurDashboard = ({ user }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState('ausgeloggt');
    const [timeEntries, setTimeEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activePage, setActivePage] = useState('dashboard');
    const [isWorking, setIsWorking] = useState(false);
    const [workSummary, setWorkSummary] = useState({
        total_hours: '0.00',
        regular_hours: '0.00',
        overtime_hours: '0.00',
        entries_count: 0
    });
    const [breakStatus, setBreakStatus] = useState('no_break');
    const [weather, setWeather] = useState({
        temperature: 22,
        condition: 'Sonnig',
        icon: '☀️',
        city: 'München'
    });

    // Arbeitszeit & Abwesenheiten State
    const [vacationRequests, setVacationRequests] = useState([]);
    const [sickLeaves, setSickLeaves] = useState([]);
    const [showVacationForm, setShowVacationForm] = useState(false);
    const [showSickForm, setShowSickForm] = useState(false);

    // Aufträge State
    const [orders, setOrders] = useState([]);
    const [dailyReports, setDailyReports] = useState([]);
    const [showDailyReportForm, setShowDailyReportForm] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchCurrentStatus();
        fetchTimeEntries();
        fetchWorkSummary();
        fetchWeather();
        fetchVacationRequests();
        fetchOrders();
        fetchDailyReports();
    }, []);

    const fetchWeather = async () => {
        try {
            const weatherData = {
                temperature: Math.floor(Math.random() * 15) + 15,
                conditions: ['Sonnig', 'Leicht bewölkt', 'Regnerisch', 'Gewitter'],
                icons: ['☀️', '⛅', '🌧️', '⛈️'],
                condition: 'Sonnig',
                icon: '☀️',
                city: 'München'
            };
            
            const randomIndex = Math.floor(Math.random() * weatherData.conditions.length);
            setWeather({
                temperature: weatherData.temperature,
                condition: weatherData.conditions[randomIndex],
                icon: weatherData.icons[randomIndex],
                city: weatherData.city
            });
        } catch (error) {
            console.error('Error fetching weather:', error);
        }
    };

    const fetchCurrentStatus = async () => {
        try {
            const response = await axios.get('/api/monteur/current-status', {
                withCredentials: true
            });
            if (response.data.success) {
                setStatus(response.data.status);
                setIsWorking(response.data.status === 'eingeloggt');
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    const fetchTimeEntries = async () => {
        try {
            const response = await axios.get('/api/monteur/time-entries', {
                withCredentials: true
            });
            if (response.data.success) {
                setTimeEntries(response.data.entries);
            }
        } catch (error) {
            console.error('Error fetching time entries:', error);
        }
    };

    const fetchWorkSummary = async () => {
        try {
            const response = await axios.get('/api/monteur/work-summary', {
                withCredentials: true
            });
            if (response.data.success) {
                setWorkSummary(response.data.summary);
            }
        } catch (error) {
            console.error('Error fetching work summary:', error);
        }
    };

    const fetchVacationRequests = async () => {
        try {
            const response = await axios.get('/api/monteur/vacation-requests', {
                withCredentials: true
            });
            if (response.data.success) {
                setVacationRequests(response.data.requests);
            }
        } catch (error) {
            console.error('Error fetching vacation requests:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await axios.get('/api/monteur/orders', {
                withCredentials: true
            });
            if (response.data.success) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchDailyReports = async () => {
        try {
            const response = await axios.get('/api/monteur/daily-reports', {
                withCredentials: true
            });
            if (response.data.success) {
                setDailyReports(response.data.reports);
            }
        } catch (error) {
            console.error('Error fetching daily reports:', error);
        }
    };

    const handleClockIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/monteur/clock-in', {}, {
                withCredentials: true
            });
            if (response.data.success) {
                setIsWorking(true);
                setStatus('eingeloggt');
                fetchTimeEntries();
                fetchWorkSummary();
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Fehler beim Einstempeln');
            console.error('Error clocking in:', error);
        }
        setLoading(false);
    };

    const handleClockOut = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/monteur/clock-out', {}, {
                withCredentials: true
            });
            if (response.data.success) {
                setIsWorking(false);
                setStatus('ausgeloggt');
                fetchTimeEntries();
                fetchWorkSummary();
                
                if (response.data.work_hours) {
                    const hours = response.data.work_hours;
                    if (hours > 8) {
                        setError(`Warnung: ${hours}h gearbeitet (über 8h)`);
                    }
                }
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Fehler beim Ausstempeln');
            console.error('Error clocking out:', error);
        }
        setLoading(false);
    };

    const handleBreak = async (action) => {
        setLoading(true);
        try {
            const response = await axios.post(`/api/monteur/${action}-break`, {}, {
                withCredentials: true
            });
            if (response.data.success) {
                setBreakStatus(action === 'start' ? 'on_break' : 'no_break');
            }
        } catch (error) {
            console.error(`Error ${action}ing break:`, error);
        }
        setLoading(false);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTimeEntry = (timeString) => {
        if (!timeString) return '-';
        const date = new Date(timeString);
        return date.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };

    const renderDashboard = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Aktueller Status</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {isWorking ? 'Eingeloggt' : 'Ausgeloggt'}
                            </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isWorking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Heute gearbeitet</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{workSummary.total_hours} Std</p>
                        {parseFloat(workSummary.overtime_hours) > 0 && (
                            <p className="text-sm text-orange-600 mt-1">+{workSummary.overtime_hours}h Überstunden</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Heutiger Auftrag</p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">Wartung Hauptstraße</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Pausenstatus</p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                            {breakStatus === 'on_break' ? 'Pause' : 'Arbeit'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Zeiterfassung</h3>
                
                <div className="flex items-center justify-between mb-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{formatTime(currentTime)}</div>
                        <div className="text-sm text-gray-600 mt-1">{formatDate(currentTime)}</div>
                    </div>
                    
                    <div className="flex space-x-4">
                        <button
                            onClick={handleClockIn}
                            disabled={loading || isWorking}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                isWorking 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {loading ? '...' : 'Einstempeln'}
                        </button>
                        
                        <button
                            onClick={handleClockOut}
                            disabled={loading || !isWorking}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                !isWorking 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                        >
                            {loading ? '...' : 'Ausstempeln'}
                        </button>

                        {isWorking && (
                            <button
                                onClick={() => handleBreak(breakStatus === 'on_break' ? 'end' : 'start')}
                                disabled={loading}
                                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                                    breakStatus === 'on_break'
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                }`}
                            >
                                {loading ? '...' : breakStatus === 'on_break' ? 'Pause beenden' : 'Pause starten'}
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Reguläre Stunden</div>
                        <div className="text-lg font-semibold text-gray-900">{workSummary.regular_hours}h</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Überstunden</div>
                        <div className="text-lg font-semibold text-orange-600">{workSummary.overtime_hours}h</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Einträge heute</div>
                        <div className="text-lg font-semibold text-gray-900">{workSummary.entries_count}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Wetter München</h4>
                    <div className="flex items-center space-x-4">
                        <div className="text-4xl">{weather.icon}</div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{weather.temperature}°C</div>
                            <div className="text-sm text-gray-600">{weather.condition}</div>
                            <div className="text-xs text-gray-500 mt-1">{weather.city}</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                            <div>
                                <div className="font-medium">Heute</div>
                                <div>15° - 25°</div>
                            </div>
                            <div>
                                <div className="font-medium">Morgen</div>
                                <div>12° - 22°</div>
                            </div>
                            <div>
                                <div className="font-medium">Übermorgen</div>
                                <div>14° - 24°</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Benachrichtigungen</h4>
                    <div className="space-y-3">
                        {parseFloat(workSummary.overtime_hours) > 0 && (
                            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-sm text-orange-900">Überstunden beantragen ({workSummary.overtime_hours}h)</span>
                            </div>
                        )}
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-blue-900">Neuer Auftrag zugewiesen</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-900">Urlaub genehmigt</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderZeiterfassung = () => (
        <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Zeiterfassung</h3>
                <p className="text-gray-600 mb-8">Erfassen Sie Ihre Arbeitszeiten und Pausen.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Einstempeln / Ausstempeln</h4>
                        <p className="text-gray-600 text-sm mb-4">Erfassen Sie Ihren Arbeitsbeginn und -ende.</p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={handleClockIn}
                                disabled={isWorking}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    isWorking 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                Einstempeln
                            </button>
                            <button 
                                onClick={handleClockOut}
                                disabled={!isWorking}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    !isWorking 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                            >
                                Ausstempeln
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Pausen</h4>
                        <p className="text-gray-600 text-sm mb-4">Verwalten Sie Ihre Pausenzeiten.</p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => handleBreak('start')}
                                disabled={!isWorking || breakStatus === 'on_break'}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    !isWorking || breakStatus === 'on_break'
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                }`}
                            >
                                Pause starten
                            </button>
                            <button 
                                onClick={() => handleBreak('end')}
                                disabled={breakStatus !== 'on_break'}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    breakStatus !== 'on_break'
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                Pause beenden
                            </button>
                        </div>
                    </div>
                </div>

                {parseFloat(workSummary.overtime_hours) > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-6">
                        <h4 className="text-lg font-semibold text-orange-900 mb-2">Überstunden-Warnung</h4>
                        <p className="text-orange-800 text-sm mb-4">
                            Sie haben heute {workSummary.overtime_hours} Überstunden geleistet. 
                            Bitte beantragen Sie diese bei Ihrem Vorgesetzten.
                        </p>
                        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                            Überstunden beantragen
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderArbeitszeit = () => (
        <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Arbeitszeit & Abwesenheiten</h3>
                <p className="text-gray-600 mb-8">Verwalten Sie Urlaub, Krankheit und Freistellungen.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Urlaub beantragen</h4>
                        <p className="text-gray-600 text-sm mb-4">Stellen Sie Anträge für Urlaub und Freistellungen.</p>
                        <button 
                            onClick={() => setShowVacationForm(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Urlaub beantragen
                        </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Krankmeldung</h4>
                        <p className="text-gray-600 text-sm mb-4">Melden Sie sich krank oder erfassen Sie Arztbesuche.</p>
                        <button 
                            onClick={() => setShowSickForm(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                        >
                            Krankmeldung erstellen
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Meine Anträge</h4>
                    <div className="space-y-4">
                        {vacationRequests.map((request, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900">
                                        Urlaub: {request.start_date} - {request.end_date}
                                    </div>
                                    <div className="text-sm text-gray-600">{request.reason}</div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {request.status === 'approved' ? 'Genehmigt' :
                                     request.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAuftraege = () => (
        <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Aufträge & Tagesberichte</h3>
                <p className="text-gray-600 mb-8">Erfassen Sie Ihre Tagesleistung, Stücklohn und Notdienst.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Tagesberichte</h4>
                        <p className="text-gray-600 text-sm mb-4">Erfassen Sie Ihre tägliche Arbeit und Leistung.</p>
                        <button 
                            onClick={() => setShowDailyReportForm(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Tagesbericht erstellen
                        </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Prämienlohn</h4>
                        <p className="text-gray-600 text-sm">Verwalten Sie Stücklohn und Prämien.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Meine Aufträge</h4>
                        <div className="space-y-4">
                            {orders.map((order, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">{order.title}</div>
                                        <div className="text-sm text-gray-600">{order.location}</div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {order.status === 'completed' ? 'Abgeschlossen' :
                                         order.status === 'in_progress' ? 'In Bearbeitung' : 'Zugewiesen'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Tagesberichte</h4>
                        <div className="space-y-4">
                            {dailyReports.map((report, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">{report.date}</div>
                                        <div className="text-sm text-gray-600">{report.work_description}</div>
                                        <div className="text-xs text-gray-500">{report.hours_worked}h</div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {report.status === 'approved' ? 'Genehmigt' :
                                         report.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activePage) {
            case 'dashboard':
                return renderDashboard();
            case 'zeiterfassung':
                return renderZeiterfassung();
            case 'arbeitszeit':
                return renderArbeitszeit();
            case 'auftraege':
                return renderAuftraege();
            default:
                return renderDashboard();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-blue-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <div className="text-2xl font-bold text-white">Lackner Aufzüge</div>
                        </div>
                        <div className="flex items-center space-x-8">
                            <div className="text-center">
                                <div className="text-xs text-blue-200 mb-1">Datum & Zeit</div>
                                <div className="text-sm font-medium text-white">{formatDate(currentTime)}</div>
                                <div className="text-sm text-blue-200">{formatTime(currentTime)}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-blue-200 mb-1">Benutzer</div>
                                <div className="text-sm font-medium text-white">{user?.name || 'Benutzer'}</div>
                                <div className="text-xs text-blue-200">{user?.role || 'Monteur'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {[
                            { id: 'dashboard', name: 'Dashboard' },
                            { id: 'zeiterfassung', name: 'Zeiterfassung' },
                            { id: 'arbeitszeit', name: 'Arbeitszeit' },
                            { id: 'auftraege', name: 'Aufträge' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activePage === item.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default MonteurDashboard;

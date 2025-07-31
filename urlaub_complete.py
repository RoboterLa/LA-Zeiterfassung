@app.route('/urlaub')
def urlaub():
    if 'user' not in session:
        return redirect('/login')
    
    # Get vacations from database
    db_session = get_db_session()
    try:
        if session['user']['role'] == 'Admin':
            vacations = db_session.query(Vacation).all()
        else:
            vacations = db_session.query(Vacation).filter_by(user_id=session['user']['id']).all()
        
        # Convert to JSON for frontend
        vacations_data = []
        for v in vacations:
            vacation_data = {
                'id': v.id,
                'user_id': v.user_id,
                'user_name': v.user.name if v.user else 'Unbekannt',
                'start_date': v.start_date.isoformat() if v.start_date else None,
                'end_date': v.end_date.isoformat() if v.end_date else None,
                'type': v.type,
                'start_time': v.start_time.isoformat() if v.start_time else None,
                'end_time': v.end_time.isoformat() if v.end_time else None,
                'duration': v.duration,
                'comment': v.comment,
                'status': v.status,
                'rejection_note': v.rejection_note,
                'history': json.loads(v.history) if v.history else [],
                'created_at': v.created_at.isoformat() if v.created_at else None,
                'updated_at': v.updated_at.isoformat() if v.updated_at else None
            }
            vacations_data.append(vacation_data)
    
    finally:
        db_session.close()
    
    # Vollständige Urlaubsverwaltungsseite mit Lackner Design
    user = session['user']
    vacations_json = json.dumps(vacations_data)
    
    return f"""
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Urlaubsverwaltung - Lackner Aufzüge</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/de.js"></script>
        <style>
            :root {{
                --lackner-blue: #60a5fa;
                --lackner-light-blue: #93c5fd;
                --lackner-dark-blue: #3b82f6;
                --lackner-gray: #6b7280;
                --lackner-light-gray: #f3f4f6;
                --lackner-white: #ffffff;
                --lackner-border: #e5e7eb;
            }}
            
            .lackner-header {{
                background: linear-gradient(135deg, var(--lackner-blue) 0%, var(--lackner-dark-blue) 100%);
            }}
            
            .lackner-button {{
                background: var(--lackner-blue);
                color: white;
                transition: all 0.3s ease;
            }}
            .lackner-button:hover {{
                background: var(--lackner-dark-blue);
                transform: translateY(-1px);
            }}
            
            .lackner-secondary-button {{
                background: var(--lackner-white);
                color: var(--lackner-blue);
                border: 2px solid var(--lackner-blue);
                transition: all 0.3s ease;
            }}
            .lackner-secondary-button:hover {{
                background: var(--lackner-blue);
                color: white;
            }}
            
            .mobile-menu {{
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }}
            .mobile-menu.open {{
                transform: translateX(0);
            }}
            
            .vacation-card {{
                transition: all 0.3s ease;
            }}
            .vacation-card:hover {{
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }}
            
            .modal {{
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }}
            
            .modal-content {{
                background-color: white;
                margin: 5% auto;
                padding: 0;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
            }}
            
            .status-pending {{
                background-color: #fef3c7;
                color: #92400e;
            }}
            
            .status-approved {{
                background-color: #d1fae5;
                color: #065f46;
            }}
            
            .status-rejected {{
                background-color: #fee2e2;
                color: #991b1b;
            }}
        </style>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen">
            <!-- Haupt-Header mit Lackner Design -->
            <header class="lackner-header text-white shadow-lg">
                <div class="container mx-auto px-4 py-3">
                    <div class="flex justify-between items-center">
                        <!-- Logo und Titel -->
                        <div class="flex items-center space-x-4">
                            <div class="bg-white rounded-lg p-2 shadow-md">
                                <img src="https://lackner-aufzuege-gmbh.com/wp-content/uploads/2021/09/cropped-2205_lackner_r.png" 
                                     alt="Lackner Aufzüge" class="h-10">
                            </div>
                            <div>
                                <h1 class="text-xl font-bold">Urlaubsverwaltung</h1>
                                <p class="text-sm opacity-90">Lackner Aufzüge GmbH</p>
                            </div>
                        </div>
                        
                        <!-- Desktop Navigation -->
                        <nav class="hidden lg:flex items-center space-x-6">
                            <!-- Nur User-Menu und Notifications in der obersten Leiste -->
                        </nav>
                        
                        <!-- Rechte Seite: User -->
                        <div class="flex items-center space-x-4">
                            <!-- User Menu -->
                            <div class="relative">
                                <button id="user-menu-btn" class="flex items-center space-x-2 hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                    <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                        <i class="fas fa-user text-blue-600"></i>
                                    </div>
                                    <span class="hidden md:block text-white">{user['name']}</span>
                                    <i class="fas fa-chevron-down text-sm text-white"></i>
                                </button>
                                
                                <!-- User Dropdown -->
                                <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 hidden">
                                    <div class="p-3 border-b">
                                        <div class="font-medium text-gray-900">{user['name']}</div>
                                        <div class="text-sm text-gray-600">{user['email']}</div>
                                    </div>
                                    <div class="py-1">
                                        <a href="/profile" class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <i class="fas fa-user-cog mr-2"></i>Profil
                                        </a>
                                        <a href="/settings" class="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <i class="fas fa-cog mr-2"></i>Einstellungen
                                        </a>
                                        <hr class="my-1">
                                        <a href="/logout" class="block px-3 py-2 text-sm text-red-600 hover:bg-gray-100">
                                            <i class="fas fa-sign-out-alt mr-2"></i>Abmelden
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Mobile Menu Button -->
                            <button id="mobile-menu-btn" class="lg:hidden text-white p-2 hover:bg-blue-700 rounded-lg transition-colors">
                                <i class="fas fa-bars text-xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <!-- Mobile Navigation Menu -->
            <div id="mobile-menu" class="mobile-menu fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 lg:hidden">
                <div class="p-4 border-b">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <img src="https://lackner-aufzuege-gmbh.com/wp-content/uploads/2021/09/cropped-2205_lackner_r.png" 
                                 alt="Lackner Aufzüge" class="h-8">
                            <span class="font-bold text-gray-900">Menu</span>
                        </div>
                        <button id="close-mobile-menu" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <nav class="p-4">
                    <div class="space-y-2">
                        <a href="/" class="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                            <i class="fas fa-home mr-3"></i>Dashboard
                        </a>
                        <a href="/meine-auftraege" class="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                            <i class="fas fa-tasks mr-3"></i>Aufträge
                        </a>
                        <a href="/arbeitszeit" class="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                            <i class="fas fa-clock mr-3"></i>Arbeitszeit
                        </a>
                        <a href="/urlaub" class="block px-4 py-3 text-blue-700 bg-blue-50 rounded-lg">
                            <i class="fas fa-umbrella-beach mr-3"></i>Urlaub
                        </a>
                        <a href="/zeiterfassung" class="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                            <i class="fas fa-stopwatch mr-3"></i>Zeiterfassung
                        </a>
                        <hr class="my-4">
                        <a href="/logout" class="block px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <i class="fas fa-sign-out-alt mr-3"></i>Abmelden
                        </a>
                    </div>
                </nav>
            </div>
            
            <!-- Mobile Menu Overlay -->
            <div id="mobile-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden hidden"></div>
            
            <!-- Untermenüband für Hauptnavigation -->
            <div class="bg-white shadow-sm border-b">
                <div class="container mx-auto px-4 py-3">
                    <nav class="flex items-center justify-center space-x-8">
                        <a href="/" class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <i class="fas fa-home text-blue-600 text-lg"></i>
                            <span class="font-medium text-gray-700">Dashboard</span>
                        </a>
                        <a href="/meine-auftraege" class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <i class="fas fa-tasks text-blue-600 text-lg"></i>
                            <span class="font-medium text-gray-700">Aufträge</span>
                        </a>
                        <a href="/arbeitszeit" class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <i class="fas fa-clock text-blue-600 text-lg"></i>
                            <span class="font-medium text-gray-700">Arbeitszeit</span>
                        </a>
                        <a href="/urlaub" class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                            <i class="fas fa-umbrella-beach text-blue-600 text-lg"></i>
                            <span class="font-medium">Urlaub</span>
                        </a>
                        <a href="/zeiterfassung" class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <i class="fas fa-stopwatch text-blue-600 text-lg"></i>
                            <span class="font-medium text-gray-700">Zeiterfassung</span>
                        </a>
                    </nav>
                </div>
            </div>
            
            <main class="container mx-auto p-6">
                <!-- Begrüßung und Status -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">
                        Urlaubsverwaltung
                    </h1>
                    <p class="text-gray-600">Verwalten Sie Ihre Urlaubsanträge</p>
                </div>

                <!-- Urlaubs-Statistiken -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <div class="text-3xl font-bold text-blue-600 mb-2" id="total-vacations">0</div>
                        <div class="text-sm text-gray-600">Gesamt Anträge</div>
                        <div class="text-xs text-gray-500 mt-1">Dieses Jahr</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <div class="text-3xl font-bold text-gray-700 mb-2" id="pending-vacations">0</div>
                        <div class="text-sm text-gray-600">Ausstehend</div>
                        <div class="text-xs text-gray-500 mt-1">Warten auf Genehmigung</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <div class="text-3xl font-bold text-green-600 mb-2" id="approved-vacations">0</div>
                        <div class="text-sm text-gray-600">Genehmigt</div>
                        <div class="text-xs text-gray-500 mt-1">Bestätigte Anträge</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <div class="text-3xl font-bold text-red-600 mb-2" id="rejected-vacations">0</div>
                        <div class="text-sm text-gray-600">Abgelehnt</div>
                        <div class="text-xs text-gray-500 mt-1">Nicht genehmigt</div>
                    </div>
                </div>

                <!-- Filter und Aktionen -->
                <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div class="flex flex-wrap gap-2">
                            <button id="filter-all" class="lackner-button px-4 py-2 rounded-lg text-sm font-medium">
                                Alle
                            </button>
                            <button id="filter-pending" class="lackner-secondary-button px-4 py-2 rounded-lg text-sm font-medium">
                                Ausstehend
                            </button>
                            <button id="filter-approved" class="lackner-secondary-button px-4 py-2 rounded-lg text-sm font-medium">
                                Genehmigt
                            </button>
                            <button id="filter-rejected" class="lackner-secondary-button px-4 py-2 rounded-lg text-sm font-medium">
                                Abgelehnt
                            </button>
                        </div>
                        <div class="flex gap-2">
                            <button id="new-vacation-btn" class="lackner-button px-4 py-2 rounded-lg">
                                <i class="fas fa-plus mr-2"></i>Neuer Antrag
                            </button>
                            {f'<button id="export-btn" class="lackner-secondary-button px-4 py-2 rounded-lg"><i class="fas fa-download mr-2"></i>Export CSV</button>' if user['role'] == 'Admin' else ''}
                        </div>
                    </div>
                </div>

                <!-- Urlaubsanträge Tabelle -->
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Urlaubsanträge</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Antrag
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Zeitraum
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Typ
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dauer
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kommentar
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aktionen
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="vacations-tbody" class="bg-white divide-y divide-gray-200">
                                <!-- Vacation rows will be populated by JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>

        <!-- Neuer Urlaubsantrag Modal -->
        <div id="vacation-modal" class="modal">
            <div class="modal-content">
                <div class="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-semibold" id="modal-title">Neuer Urlaubsantrag</h2>
                        <button id="close-modal" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <form id="vacation-form">
                        <input type="hidden" id="vacation-id">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label for="start-date" class="block text-sm font-medium text-gray-700 mb-2">
                                    Startdatum *
                                </label>
                                <input type="text" id="start-date" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            </div>
                            <div>
                                <label for="end-date" class="block text-sm font-medium text-gray-700 mb-2">
                                    Enddatum *
                                </label>
                                <input type="text" id="end-date" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label for="vacation-type" class="block text-sm font-medium text-gray-700 mb-2">
                                    Typ *
                                </label>
                                <select id="vacation-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                    <option value="full_day">Ganzer Tag</option>
                                    <option value="hourly">Stundenweise</option>
                                </select>
                            </div>
                            <div id="time-fields" class="hidden">
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label for="start-time" class="block text-sm font-medium text-gray-700 mb-2">
                                            Startzeit
                                        </label>
                                        <input type="time" id="start-time" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </div>
                                    <div>
                                        <label for="end-time" class="block text-sm font-medium text-gray-700 mb-2">
                                            Endzeit
                                        </label>
                                        <input type="time" id="end-time" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <label for="vacation-comment" class="block text-sm font-medium text-gray-700 mb-2">
                                Kommentar
                            </label>
                            <textarea id="vacation-comment" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional: Beschreibung des Urlaubsantrags..."></textarea>
                        </div>
                        
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancel-vacation" class="lackner-secondary-button px-4 py-2 rounded-lg">
                                Abbrechen
                            </button>
                            <button type="submit" class="lackner-button px-4 py-2 rounded-lg">
                                <i class="fas fa-save mr-2"></i>Speichern
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Approve/Reject Modal -->
        <div id="action-modal" class="modal">
            <div class="modal-content">
                <div class="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-semibold" id="action-modal-title">Antrag bearbeiten</h2>
                        <button id="close-action-modal" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <form id="action-form">
                        <input type="hidden" id="action-vacation-id">
                        <input type="hidden" id="action-type">
                        
                        <div class="mb-4">
                            <label for="action-note" class="block text-sm font-medium text-gray-700 mb-2">
                                <span id="note-label">Notiz</span>
                            </label>
                            <textarea id="action-note" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional: Notiz zur Aktion..."></textarea>
                        </div>
                        
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancel-action" class="lackner-secondary-button px-4 py-2 rounded-lg">
                                Abbrechen
                            </button>
                            <button type="submit" class="lackner-button px-4 py-2 rounded-lg">
                                <i class="fas fa-check mr-2"></i>Bestätigen
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script>
            // Vacation data from backend
            let vacations = {vacations_json};
            let currentFilter = 'all';
            
            // Initialize date pickers
            flatpickr("#start-date", {{
                locale: "de",
                dateFormat: "Y-m-d",
                defaultDate: "today"
            }});
            
            flatpickr("#end-date", {{
                locale: "de",
                dateFormat: "Y-m-d",
                defaultDate: "today"
            }});
            
            // Mobile Menu
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileOverlay = document.getElementById('mobile-overlay');
            const closeMobileMenu = document.getElementById('close-mobile-menu');

            function openMobileMenu() {{
                mobileMenu.classList.add('open');
                mobileOverlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }}

            function closeMobileMenuFunc() {{
                mobileMenu.classList.remove('open');
                mobileOverlay.classList.add('hidden');
                document.body.style.overflow = '';
            }}

            mobileMenuBtn.addEventListener('click', openMobileMenu);
            closeMobileMenu.addEventListener('click', closeMobileMenuFunc);
            mobileOverlay.addEventListener('click', closeMobileMenuFunc);

            // User Menu
            document.getElementById('user-menu-btn').addEventListener('click', function() {{
                const dropdown = document.getElementById('user-dropdown');
                dropdown.classList.toggle('hidden');
            }});

            // Modal functions
            function openModal(modalId) {{
                document.getElementById(modalId).style.display = 'block';
            }}

            function closeModal(modalId) {{
                document.getElementById(modalId).style.display = 'none';
            }}

            // Vacation type change
            document.getElementById('vacation-type').addEventListener('change', function() {{
                const timeFields = document.getElementById('time-fields');
                if (this.value === 'hourly') {{
                    timeFields.classList.remove('hidden');
                }} else {{
                    timeFields.classList.add('hidden');
                }}
            }});

            // New vacation button
            document.getElementById('new-vacation-btn').addEventListener('click', function() {{
                document.getElementById('modal-title').textContent = 'Neuer Urlaubsantrag';
                document.getElementById('vacation-id').value = '';
                document.getElementById('vacation-form').reset();
                document.getElementById('time-fields').classList.add('hidden');
                openModal('vacation-modal');
            }});

            // Close modal buttons
            document.getElementById('close-modal').addEventListener('click', function() {{
                closeModal('vacation-modal');
            }});

            document.getElementById('cancel-vacation').addEventListener('click', function() {{
                closeModal('vacation-modal');
            }});

            document.getElementById('close-action-modal').addEventListener('click', function() {{
                closeModal('action-modal');
            }});

            document.getElementById('cancel-action').addEventListener('click', function() {{
                closeModal('action-modal');
            }});

            // Vacation form submit
            document.getElementById('vacation-form').addEventListener('submit', function(e) {{
                e.preventDefault();
                
                const formData = {{
                    start_date: document.getElementById('start-date').value,
                    end_date: document.getElementById('end-date').value,
                    type: document.getElementById('vacation-type').value,
                    comment: document.getElementById('vacation-comment').value
                }};
                
                if (formData.type === 'hourly') {{
                    formData.start_time = document.getElementById('start-time').value;
                    formData.end_time = document.getElementById('end-time').value;
                }}
                
                const vacationId = document.getElementById('vacation-id').value;
                const url = vacationId ? `/api/urlaub/${{vacationId}}` : '/api/urlaub';
                const method = vacationId ? 'PUT' : 'POST';
                
                fetch(url, {{
                    method: method,
                    headers: {{
                        'Content-Type': 'application/json',
                    }},
                    body: JSON.stringify(formData)
                }})
                .then(response => response.json())
                .then(data => {{
                    if (data.status === 'success') {{
                        closeModal('vacation-modal');
                        loadVacations();
                        alert('Urlaubsantrag erfolgreich gespeichert!');
                    }} else {{
                        alert('Fehler: ' + data.error);
                    }}
                }})
                .catch(error => {{
                    console.error('Error:', error);
                    alert('Fehler beim Speichern des Antrags');
                }});
            }});

            // Action form submit
            document.getElementById('action-form').addEventListener('submit', function(e) {{
                e.preventDefault();
                
                const vacationId = document.getElementById('action-vacation-id').value;
                const actionType = document.getElementById('action-type').value;
                const note = document.getElementById('action-note').value;
                
                if (actionType === 'reject' && !note) {{
                    alert('Ablehnungsgrund ist erforderlich!');
                    return;
                }}
                
                const formData = new FormData();
                formData.append('note', note);
                
                fetch(`/api/urlaub/${{vacationId}}/${{actionType}}`, {{
                    method: 'POST',
                    body: formData
                }})
                .then(response => response.json())
                .then(data => {{
                    if (data.status === 'success') {{
                        closeModal('action-modal');
                        loadVacations();
                        alert(`Antrag erfolgreich ${{actionType === 'approve' ? 'genehmigt' : 'abgelehnt'}}!`);
                    }} else {{
                        alert('Fehler: ' + data.error);
                    }}
                }})
                .catch(error => {{
                    console.error('Error:', error);
                    alert('Fehler bei der Aktion');
                }});
            }});

            // Filter functions
            function setFilter(filter) {{
                currentFilter = filter;
                document.querySelectorAll('[id^="filter-"]').forEach(btn => {{
                    btn.classList.remove('lackner-button');
                    btn.classList.add('lackner-secondary-button');
                }});
                document.getElementById(`filter-${{filter}}`).classList.remove('lackner-secondary-button');
                document.getElementById(`filter-${{filter}}`).classList.add('lackner-button');
                renderVacations();
            }}

            // Render vacations
            function renderVacations() {{
                const tbody = document.getElementById('vacations-tbody');
                tbody.innerHTML = '';
                
                const filteredVacations = vacations.filter(v => {{
                    if (currentFilter === 'all') return true;
                    return v.status === currentFilter;
                }});
                
                filteredVacations.forEach(vacation => {{
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50';
                    
                    const startDate = new Date(vacation.start_date).toLocaleDateString('de-DE');
                    const endDate = new Date(vacation.end_date).toLocaleDateString('de-DE');
                    const duration = vacation.duration ? `${vacation.duration} Stunden` : 'N/A';
                    const type = vacation.type === 'full_day' ? 'Ganzer Tag' : 'Stundenweise';
                    
                    let statusClass = '';
                    let statusText = '';
                    switch(vacation.status) {{
                        case 'pending':
                            statusClass = 'status-pending';
                            statusText = 'Ausstehend';
                            break;
                        case 'approved':
                            statusClass = 'status-approved';
                            statusText = 'Genehmigt';
                            break;
                        case 'rejected':
                            statusClass = 'status-rejected';
                            statusText = 'Abgelehnt';
                            break;
                    }}
                    
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">#${{vacation.id}}</div>
                            <div class="text-sm text-gray-500">${{vacation.user_name}}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${{startDate}} - ${{endDate}}</div>
                            ${{vacation.start_time && vacation.end_time ? `<div class="text-sm text-gray-500">${{vacation.start_time}} - ${{vacation.end_time}}</div>` : ''}}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${{type}}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${{duration}}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${{statusClass}}">${{statusText}}</span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">${{vacation.comment || '-'}}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ${{getActionButtons(vacation)}}
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                }});
                
                updateStatistics();
            }}

            function getActionButtons(vacation) {{
                const buttons = [];
                
                if (vacation.status === 'pending') {{
                    if ('{user['role']}' === 'Admin') {{
                        buttons.push(`<button onclick="approveVacation(${{vacation.id}})" class="text-green-600 hover:text-green-900 mr-2"><i class="fas fa-check"></i></button>`);
                        buttons.push(`<button onclick="rejectVacation(${{vacation.id}})" class="text-red-600 hover:text-red-900 mr-2"><i class="fas fa-times"></i></button>`);
                    }}
                    buttons.push(`<button onclick="editVacation(${{vacation.id}})" class="text-blue-600 hover:text-blue-900 mr-2"><i class="fas fa-edit"></i></button>`);
                }}
                
                if (vacation.status === 'rejected' || (vacation.status === 'pending' && '{user['role']}' === 'Admin')) {{
                    buttons.push(`<button onclick="deleteVacation(${{vacation.id}})" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>`);
                }}
                
                return buttons.join('');
            }}

            function approveVacation(id) {{
                document.getElementById('action-vacation-id').value = id;
                document.getElementById('action-type').value = 'approve';
                document.getElementById('action-modal-title').textContent = 'Antrag genehmigen';
                document.getElementById('note-label').textContent = 'Notiz (optional)';
                document.getElementById('action-note').placeholder = 'Optional: Notiz zur Genehmigung...';
                openModal('action-modal');
            }}

            function rejectVacation(id) {{
                document.getElementById('action-vacation-id').value = id;
                document.getElementById('action-type').value = 'reject';
                document.getElementById('action-modal-title').textContent = 'Antrag ablehnen';
                document.getElementById('note-label').textContent = 'Ablehnungsgrund *';
                document.getElementById('action-note').placeholder = 'Grund für die Ablehnung...';
                openModal('action-modal');
            }}

            function editVacation(id) {{
                const vacation = vacations.find(v => v.id === id);
                if (!vacation) return;
                
                document.getElementById('modal-title').textContent = 'Urlaubsantrag bearbeiten';
                document.getElementById('vacation-id').value = vacation.id;
                document.getElementById('start-date').value = vacation.start_date;
                document.getElementById('end-date').value = vacation.end_date;
                document.getElementById('vacation-type').value = vacation.type;
                document.getElementById('vacation-comment').value = vacation.comment || '';
                
                if (vacation.type === 'hourly') {{
                    document.getElementById('time-fields').classList.remove('hidden');
                    document.getElementById('start-time').value = vacation.start_time || '';
                    document.getElementById('end-time').value = vacation.end_time || '';
                }} else {{
                    document.getElementById('time-fields').classList.add('hidden');
                }}
                
                openModal('vacation-modal');
            }}

            function deleteVacation(id) {{
                if (!confirm('Möchten Sie diesen Antrag wirklich löschen?')) return;
                
                fetch(`/api/urlaub/${{id}}`, {{
                    method: 'DELETE'
                }})
                .then(response => response.json())
                .then(data => {{
                    if (data.status === 'success') {{
                        loadVacations();
                        alert('Antrag erfolgreich gelöscht!');
                    }} else {{
                        alert('Fehler: ' + data.error);
                    }}
                }})
                .catch(error => {{
                    console.error('Error:', error);
                    alert('Fehler beim Löschen des Antrags');
                }});
            }}

            function updateStatistics() {{
                const total = vacations.length;
                const pending = vacations.filter(v => v.status === 'pending').length;
                const approved = vacations.filter(v => v.status === 'approved').length;
                const rejected = vacations.filter(v => v.status === 'rejected').length;
                
                document.getElementById('total-vacations').textContent = total;
                document.getElementById('pending-vacations').textContent = pending;
                document.getElementById('approved-vacations').textContent = approved;
                document.getElementById('rejected-vacations').textContent = rejected;
            }}

            function loadVacations() {{
                fetch('/api/urlaub')
                .then(response => response.json())
                .then(data => {{
                    vacations = data;
                    renderVacations();
                }})
                .catch(error => {{
                    console.error('Error loading vacations:', error);
                }});
            }}

            // Filter event listeners
            document.getElementById('filter-all').addEventListener('click', () => setFilter('all'));
            document.getElementById('filter-pending').addEventListener('click', () => setFilter('pending'));
            document.getElementById('filter-approved').addEventListener('click', () => setFilter('approved'));
            document.getElementById('filter-rejected').addEventListener('click', () => setFilter('rejected'));

            // Export button
            {f'document.getElementById("export-btn").addEventListener("click", function() {{ window.location.href = "/api/urlaub/export"; }});' if user['role'] == 'Admin' else ''}

            // Click outside to close dropdowns
            document.addEventListener('click', function(event) {{
                if (!event.target.closest('.relative')) {{
                    document.getElementById('user-dropdown').classList.add('hidden');
                }}
            }});

            // Initialize
            renderVacations();
        </script>
    </body>
    </html>
    """ 
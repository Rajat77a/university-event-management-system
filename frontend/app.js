<<<<<<< HEAD
// Initialize localStorage if empty
function initializeStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([
            {
                id: 'admin001',
                name: 'System Administrator',
                email: 'admin@university.edu',
                phone: '1234567890',
                password: 'admin123',
                role: 'admin'
            }
        ]));
    }
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify([]));
    }
    if (!localStorage.getItem('registrations')) {
        localStorage.setItem('registrations', JSON.stringify([]));
    }
}

initializeStorage();

// Utility Functions
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
}

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getEvents() {
    return JSON.parse(localStorage.getItem('events') || '[]');
}

function saveEvents(events) {
    localStorage.setItem('events', JSON.stringify(events));
}

function getRegistrations() {
    return JSON.parse(localStorage.getItem('registrations') || '[]');
}

function saveRegistrations(registrations) {
    localStorage.setItem('registrations', JSON.stringify(registrations));
}

function generateId(prefix) {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

function showAlert(message, type = 'success') {
    alert(message);
}

// QR Code Generation
function generateQRCode(text, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 200;
    const qrSize = 25;
    const cellSize = size / qrSize;
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#000000';
    
    const hash = text.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    const random = (seed) => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    
    let seed = Math.abs(hash);
    
    for (let y = 0; y < qrSize; y++) {
        for (let x = 0; x < qrSize; x++) {
            if (random(seed++) > 0.5) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    ctx.fillRect(0, 0, cellSize * 7, cellSize * 7);
    ctx.fillRect((qrSize - 7) * cellSize, 0, cellSize * 7, cellSize * 7);
    ctx.fillRect(0, (qrSize - 7) * cellSize, cellSize * 7, cellSize * 7);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cellSize, cellSize, cellSize * 5, cellSize * 5);
    ctx.fillRect((qrSize - 6) * cellSize, cellSize, cellSize * 5, cellSize * 5);
    ctx.fillRect(cellSize, (qrSize - 6) * cellSize, cellSize * 5, cellSize * 5);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(cellSize * 2, cellSize * 2, cellSize * 3, cellSize * 3);
    ctx.fillRect((qrSize - 5) * cellSize, cellSize * 2, cellSize * 3, cellSize * 3);
    ctx.fillRect(cellSize * 2, (qrSize - 5) * cellSize, cellSize * 3, cellSize * 3);
}

// Navigation Update
function updateNavigation() {
    const currentUser = getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const adminLink = document.getElementById('adminLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const createEventBtn = document.getElementById('createEventBtn');
    
    if (currentUser) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        if (currentUser.role === 'admin') {
            if (adminLink) adminLink.style.display = 'block';
        } else if (currentUser.role === 'organizer') {
            if (createEventBtn) createEventBtn.style.display = 'block';
        }
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (adminLink) adminLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (createEventBtn) createEventBtn.style.display = 'none';
    }
}

// Logout Functionality
function setupLogout() {
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            clearCurrentUser();
            showAlert('Logged out successfully!');
            window.location.href = 'index.html';
        });
    });
}

// Register Page
// Register Page
if (window.location.pathname.endsWith('register.html')) {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const role = document.getElementById('registerRole').value;
        
        // Email domain validation based on role
        const studentDomain = '@vitapstudents.ac.in';
        const facultyOrganizerDomain = '@vitap.ac.in';
        
        if (role === 'student') {
            if (!email.endsWith(studentDomain)) {
                showAlert(`Students must register using university email ending with ${studentDomain}`, 'danger');
                return;
            }
        } else if (role === 'organizer') {
            if (!email.endsWith(facultyOrganizerDomain)) {
                showAlert(`Event Organizers must register using university email ending with ${facultyOrganizerDomain}`, 'danger');
                return;
            }
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match!', 'danger');
            return;
        }
        
        const users = getUsers();
        
        if (users.find(u => u.email === email)) {
            showAlert('Email already registered!', 'danger');
            return;
        }
        
        const newUser = {
            id: generateId('user_'),
            name,
            email,
            phone,
            password,
            role
        };
        
        users.push(newUser);
        saveUsers(users);
        
        showAlert('Registration successful! Please login.');
        window.location.href = 'login.html';
    });
}

// Login Page
if (window.location.pathname.endsWith('login.html')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;
        
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password && u.role === role);
        
        if (user) {
            setCurrentUser(user);
            showAlert('Login successful!');
            
            if (role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            showAlert('Invalid credentials or role!', 'danger');
        }
    });
}

// Index Page - Events Display
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const eventsContainer = document.getElementById('eventsContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const createEventBtn = document.getElementById('createEventBtn');
    const eventModal = document.getElementById('eventModal');
    const createEventModal = document.getElementById('createEventModal');
    const registrationModal = document.getElementById('registrationModal');
    
    function displayEvents() {
        const events = getEvents();
        const currentUser = getCurrentUser();
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        
        let filteredEvents = events.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(searchTerm) || 
                                event.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || event.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        
        if (filteredEvents.length === 0) {
            eventsContainer.innerHTML = '<p class="no-events">No events found.</p>';
            return;
        }
        
        eventsContainer.innerHTML = '';
        
        filteredEvents.forEach(event => {
            const registrations = getRegistrations().filter(r => r.eventId === event.id);
            const isOrganizer = currentUser && currentUser.id === event.organizerId;
            const isRegistered = currentUser && registrations.find(r => r.userId === currentUser.id);
            
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <div class="event-header">
                    <span class="event-category">${event.category}</span>
                </div>
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <div>📅 ${event.date} at ${event.time}</div>
                    <div>📍 ${event.location}</div>
                    <div>👤 Organized by: ${event.organizerName}</div>
                </div>
                <p class="event-description">${event.description.substring(0, 100)}...</p>
                <div class="event-footer">
                    <span class="event-capacity">${registrations.length}/${event.maxParticipants} registered</span>
                    <div class="event-actions">
                        ${isOrganizer ? `
                            <button class="btn-secondary btn-small view-registrations" data-event-id="${event.id}">View Registrations</button>
                            <button class="btn-danger btn-small delete-event" data-event-id="${event.id}">Delete</button>
                        ` : !isRegistered && registrations.length < event.maxParticipants && currentUser ? `
                            <button class="btn-success btn-small register-event" data-event-id="${event.id}">Register</button>
                        ` : isRegistered ? `
                            <button class="btn-secondary btn-small" disabled>Registered ✓</button>
                        ` : registrations.length >= event.maxParticipants ? `
                            <button class="btn-secondary btn-small" disabled>Full</button>
                        ` : ''}
                        <button class="btn-primary btn-small view-event" data-event-id="${event.id}">View Details</button>
                    </div>
                </div>
            `;
            
            eventsContainer.appendChild(eventCard);
        });
        
        // Event Listeners
        document.querySelectorAll('.view-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                showEventDetails(eventId);
            });
        });
        
        document.querySelectorAll('.register-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                registerForEvent(eventId);
            });
        });
        
        document.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                deleteEvent(eventId);
            });
        });
        
        document.querySelectorAll('.view-registrations').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                viewEventRegistrations(eventId);
            });
        });
    }
    
    function showEventDetails(eventId) {
        const event = getEvents().find(e => e.id === eventId);
        const registrations = getRegistrations().filter(r => r.eventId === eventId);
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="modal-detail-item">
                <strong>Category:</strong>
                <span>${event.category}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Date & Time:</strong>
                <span>${event.date} at ${event.time}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Location:</strong>
                <span>${event.location}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Organized by:</strong>
                <span>${event.organizerName}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Description:</strong>
                <span>${event.description}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Registrations:</strong>
                <span>${registrations.length}/${event.maxParticipants}</span>
            </div>
        `;
        
        eventModal.style.display = 'block';
    }
    
    function registerForEvent(eventId) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            showAlert('Please login to register!', 'danger');
            window.location.href = 'login.html';
            return;
        }
        
        const event = getEvents().find(e => e.id === eventId);
        const registrations = getRegistrations();
        
        if (registrations.find(r => r.eventId === eventId && r.userId === currentUser.id)) {
            showAlert('Already registered for this event!', 'danger');
            return;
        }
        
        if (registrations.filter(r => r.eventId === eventId).length >= event.maxParticipants) {
            showAlert('Event is full!', 'danger');
            return;
        }
        
        const registration = {
            id: generateId('reg_'),
            eventId: eventId,
            eventTitle: event.title,
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            userPhone: currentUser.phone,
            registeredAt: new Date().toISOString(),
            qrCode: generateId('qr_')
        };
        
        registrations.push(registration);
        saveRegistrations(registrations);
        
        showRegistrationSuccess(registration);
    }
    
    function showRegistrationSuccess(registration) {
        const modalBody = document.getElementById('registrationBody');
        modalBody.innerHTML = `
            <div class="registration-success">
                <h3>Registration Successful!</h3>
                <p>Event: ${registration.eventTitle}</p>
                <p>Your unique QR code:</p>
                <canvas id="qrCanvas"></canvas>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">Registration ID: ${registration.id}</p>
                <button class="btn-primary" onclick="window.print()">Print QR Code</button>
            </div>
        `;
        
        registrationModal.style.display = 'block';
        
        setTimeout(() => {
            generateQRCode(registration.id + registration.qrCode, 'qrCanvas');
        }, 100);
        
        displayEvents();
    }
    
    function deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        let events = getEvents();
        events = events.filter(e => e.id !== eventId);
        saveEvents(events);
        
        let registrations = getRegistrations();
        registrations = registrations.filter(r => r.eventId !== eventId);
        saveRegistrations(registrations);
        
        showAlert('Event deleted successfully!');
        displayEvents();
    }
    
    function viewEventRegistrations(eventId) {
        const event = getEvents().find(e => e.id === eventId);
        const registrations = getRegistrations().filter(r => r.eventId === eventId);
        
        const modalBody = document.getElementById('modalBody');
        
        if (registrations.length === 0) {
            modalBody.innerHTML = '<p>No registrations yet.</p>';
        } else {
            let html = '<h3>Registered Participants</h3>';
            html += '<div style="max-height: 400px; overflow-y: auto;">';
            registrations.forEach(reg => {
                html += `
                    <div style="border-bottom: 1px solid var(--border-color); padding: 1rem 0;">
                        <p><strong>Name:</strong> ${reg.userName}</p>
                        <p><strong>Email:</strong> ${reg.userEmail}</p>
                        <p><strong>Phone:</strong> ${reg.userPhone}</p>
                        <p><strong>Registered:</strong> ${new Date(reg.registeredAt).toLocaleString()}</p>
                    </div>
                `;
            });
            html += '</div>';
            modalBody.innerHTML = html;
        }
        
        eventModal.style.display = 'block';
    }
    
    // Create Event
    if (createEventBtn) {
        createEventBtn.addEventListener('click', () => {
            const currentUser = getCurrentUser();
            if (!currentUser || currentUser.role !== 'organizer') {
                showAlert('Only organizers can create events!', 'danger');
                return;
            }
            createEventModal.style.display = 'block';
        });
    }
    
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentUser = getCurrentUser();
            
            const newEvent = {
                id: generateId('event_'),
                title: document.getElementById('eventTitle').value.trim(),
                category: document.getElementById('eventCategory').value,
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value,
                location: document.getElementById('eventLocation').value.trim(),
                description: document.getElementById('eventDescription').value.trim(),
                maxParticipants: parseInt(document.getElementById('eventMaxParticipants').value),
                organizerId: currentUser.id,
                organizerName: currentUser.name,
                createdAt: new Date().toISOString()
            };
            
            const events = getEvents();
            events.push(newEvent);
            saveEvents(events);
            
            showAlert('Event created successfully!');
            createEventModal.style.display = 'none';
            createEventForm.reset();
            displayEvents();
        });
    }
    
    // Search and Filter
    if (searchInput) {
        searchInput.addEventListener('input', displayEvents);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', displayEvents);
    }
    
    // Modal Close
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    displayEvents();
}

// Admin Dashboard
if (window.location.pathname.endsWith('admin.html')) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('Access denied! Admin only.', 'danger');
        window.location.href = 'index.html';
    }
    
    function loadDashboardStats() {
        const users = getUsers();
        const events = getEvents();
        const registrations = getRegistrations();
        const organizers = users.filter(u => u.role === 'organizer');
        
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalEvents').textContent = events.length;
        document.getElementById('totalRegistrations').textContent = registrations.length;
        document.getElementById('totalOrganizers').textContent = organizers.length;
    }
    
    function loadEventsTable() {
        const events = getEvents();
        const tbody = document.getElementById('eventsTableBody');
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No events found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        events.forEach(event => {
            const registrations = getRegistrations().filter(r => r.eventId === event.id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event.id}</td>
                <td>${event.title}</td>
                <td>${event.category}</td>
                <td>${event.date}</td>
                <td>${event.organizerName}</td>
                <td>${registrations.length}/${event.maxParticipants}</td>
                <td>
                    <button class="btn-danger btn-small delete-event-admin" data-event-id="${event.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.delete-event-admin').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                if (confirm('Are you sure you want to delete this event?')) {
                    let events = getEvents();
                    events = events.filter(ev => ev.id !== eventId);
                    saveEvents(events);
                    
                    let registrations = getRegistrations();
                    registrations = registrations.filter(r => r.eventId !== eventId);
                    saveRegistrations(registrations);
                    
                    showAlert('Event deleted successfully!');
                    loadEventsTable();
                    loadDashboardStats();
                }
            });
        });
    }
    
    function loadRegistrationsTable() {
        const registrations = getRegistrations();
        const tbody = document.getElementById('registrationsTableBody');
        
        if (registrations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No registrations found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        registrations.forEach(reg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reg.id}</td>
                <td>${reg.userName}</td>
                <td>${reg.userEmail}</td>
                <td>${reg.userPhone}</td>
                <td>${reg.eventTitle}</td>
                <td>${new Date(reg.registeredAt).toLocaleDateString()}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    function loadUsersTable() {
        const users = getUsers();
        const tbody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                <td>
                    ${user.role !== 'admin' ? `<button class="btn-danger btn-small delete-user" data-user-id="${user.id}">Delete</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                if (confirm('Are you sure you want to delete this user?')) {
                    let users = getUsers();
                    users = users.filter(u => u.id !== userId);
                    saveUsers(users);
                    
                    showAlert('User deleted successfully!');
                    loadUsersTable();
                    loadDashboardStats();
                }
            });
        });
    }
    
    function exportToCSV(data, filename) {
        if (data.length === 0) {
            showAlert('No data to export!', 'danger');
            return;
        }
        
        const headers = Object.keys(data[0]);
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csv += values.join(',') + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    document.getElementById('exportEventsBtn').addEventListener('click', () => {
        const events = getEvents();
        exportToCSV(events, 'events.csv');
    });
    
    document.getElementById('exportRegistrationsBtn').addEventListener('click', () => {
        const registrations = getRegistrations();
        exportToCSV(registrations, 'registrations.csv');
    });
    
    document.getElementById('exportUsersBtn').addEventListener('click', () => {
        const users = getUsers();
        exportToCSV(users, 'users.csv');
    });
    
    loadDashboardStats();
    loadEventsTable();
    loadRegistrationsTable();
    loadUsersTable();
}

// Initialize on page load
updateNavigation();
=======
// Initialize localStorage if empty
function initializeStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([
            {
                id: 'admin001',
                name: 'System Administrator',
                email: 'admin@university.edu',
                phone: '1234567890',
                password: 'admin123',
                role: 'admin'
            }
        ]));
    }
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify([]));
    }
    if (!localStorage.getItem('registrations')) {
        localStorage.setItem('registrations', JSON.stringify([]));
    }
}

initializeStorage();

// Utility Functions
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
}

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getEvents() {
    return JSON.parse(localStorage.getItem('events') || '[]');
}

function saveEvents(events) {
    localStorage.setItem('events', JSON.stringify(events));
}

function getRegistrations() {
    return JSON.parse(localStorage.getItem('registrations') || '[]');
}

function saveRegistrations(registrations) {
    localStorage.setItem('registrations', JSON.stringify(registrations));
}

function generateId(prefix) {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

function showAlert(message, type = 'success') {
    alert(message);
}

// QR Code Generation
function generateQRCode(text, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 200;
    const qrSize = 25;
    const cellSize = size / qrSize;
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#000000';
    
    const hash = text.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    const random = (seed) => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    
    let seed = Math.abs(hash);
    
    for (let y = 0; y < qrSize; y++) {
        for (let x = 0; x < qrSize; x++) {
            if (random(seed++) > 0.5) {
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    ctx.fillRect(0, 0, cellSize * 7, cellSize * 7);
    ctx.fillRect((qrSize - 7) * cellSize, 0, cellSize * 7, cellSize * 7);
    ctx.fillRect(0, (qrSize - 7) * cellSize, cellSize * 7, cellSize * 7);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cellSize, cellSize, cellSize * 5, cellSize * 5);
    ctx.fillRect((qrSize - 6) * cellSize, cellSize, cellSize * 5, cellSize * 5);
    ctx.fillRect(cellSize, (qrSize - 6) * cellSize, cellSize * 5, cellSize * 5);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(cellSize * 2, cellSize * 2, cellSize * 3, cellSize * 3);
    ctx.fillRect((qrSize - 5) * cellSize, cellSize * 2, cellSize * 3, cellSize * 3);
    ctx.fillRect(cellSize * 2, (qrSize - 5) * cellSize, cellSize * 3, cellSize * 3);
}

// Navigation Update
function updateNavigation() {
    const currentUser = getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const adminLink = document.getElementById('adminLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const createEventBtn = document.getElementById('createEventBtn');
    
    if (currentUser) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        if (currentUser.role === 'admin') {
            if (adminLink) adminLink.style.display = 'block';
        } else if (currentUser.role === 'organizer') {
            if (createEventBtn) createEventBtn.style.display = 'block';
        }
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (adminLink) adminLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (createEventBtn) createEventBtn.style.display = 'none';
    }
}

// Logout Functionality
function setupLogout() {
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            clearCurrentUser();
            showAlert('Logged out successfully!');
            window.location.href = 'index.html';
        });
    });
}

// Register Page
// Register Page
if (window.location.pathname.endsWith('register.html')) {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const role = document.getElementById('registerRole').value;
        
        // Email domain validation based on role
        const studentDomain = '@vitapstudents.ac.in';
        const facultyOrganizerDomain = '@vitap.ac.in';
        
        if (role === 'student') {
            if (!email.endsWith(studentDomain)) {
                showAlert(`Students must register using university email ending with ${studentDomain}`, 'danger');
                return;
            }
        } else if (role === 'organizer') {
            if (!email.endsWith(facultyOrganizerDomain)) {
                showAlert(`Event Organizers must register using university email ending with ${facultyOrganizerDomain}`, 'danger');
                return;
            }
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match!', 'danger');
            return;
        }
        
        const users = getUsers();
        
        if (users.find(u => u.email === email)) {
            showAlert('Email already registered!', 'danger');
            return;
        }
        
        const newUser = {
            id: generateId('user_'),
            name,
            email,
            phone,
            password,
            role
        };
        
        users.push(newUser);
        saveUsers(users);
        
        showAlert('Registration successful! Please login.');
        window.location.href = 'login.html';
    });
}

// Login Page
if (window.location.pathname.endsWith('login.html')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;
        
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password && u.role === role);
        
        if (user) {
            setCurrentUser(user);
            showAlert('Login successful!');
            
            if (role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            showAlert('Invalid credentials or role!', 'danger');
        }
    });
}

// Index Page - Events Display
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const eventsContainer = document.getElementById('eventsContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const createEventBtn = document.getElementById('createEventBtn');
    const eventModal = document.getElementById('eventModal');
    const createEventModal = document.getElementById('createEventModal');
    const registrationModal = document.getElementById('registrationModal');
    
    function displayEvents() {
        const events = getEvents();
        const currentUser = getCurrentUser();
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        
        let filteredEvents = events.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(searchTerm) || 
                                event.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || event.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        
        if (filteredEvents.length === 0) {
            eventsContainer.innerHTML = '<p class="no-events">No events found.</p>';
            return;
        }
        
        eventsContainer.innerHTML = '';
        
        filteredEvents.forEach(event => {
            const registrations = getRegistrations().filter(r => r.eventId === event.id);
            const isOrganizer = currentUser && currentUser.id === event.organizerId;
            const isRegistered = currentUser && registrations.find(r => r.userId === currentUser.id);
            
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <div class="event-header">
                    <span class="event-category">${event.category}</span>
                </div>
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <div>📅 ${event.date} at ${event.time}</div>
                    <div>📍 ${event.location}</div>
                    <div>👤 Organized by: ${event.organizerName}</div>
                </div>
                <p class="event-description">${event.description.substring(0, 100)}...</p>
                <div class="event-footer">
                    <span class="event-capacity">${registrations.length}/${event.maxParticipants} registered</span>
                    <div class="event-actions">
                        ${isOrganizer ? `
                            <button class="btn-secondary btn-small view-registrations" data-event-id="${event.id}">View Registrations</button>
                            <button class="btn-danger btn-small delete-event" data-event-id="${event.id}">Delete</button>
                        ` : !isRegistered && registrations.length < event.maxParticipants && currentUser ? `
                            <button class="btn-success btn-small register-event" data-event-id="${event.id}">Register</button>
                        ` : isRegistered ? `
                            <button class="btn-secondary btn-small" disabled>Registered ✓</button>
                        ` : registrations.length >= event.maxParticipants ? `
                            <button class="btn-secondary btn-small" disabled>Full</button>
                        ` : ''}
                        <button class="btn-primary btn-small view-event" data-event-id="${event.id}">View Details</button>
                    </div>
                </div>
            `;
            
            eventsContainer.appendChild(eventCard);
        });
        
        // Event Listeners
        document.querySelectorAll('.view-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                showEventDetails(eventId);
            });
        });
        
        document.querySelectorAll('.register-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                registerForEvent(eventId);
            });
        });
        
        document.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                deleteEvent(eventId);
            });
        });
        
        document.querySelectorAll('.view-registrations').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                viewEventRegistrations(eventId);
            });
        });
    }
    
    function showEventDetails(eventId) {
        const event = getEvents().find(e => e.id === eventId);
        const registrations = getRegistrations().filter(r => r.eventId === eventId);
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="modal-detail-item">
                <strong>Category:</strong>
                <span>${event.category}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Date & Time:</strong>
                <span>${event.date} at ${event.time}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Location:</strong>
                <span>${event.location}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Organized by:</strong>
                <span>${event.organizerName}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Description:</strong>
                <span>${event.description}</span>
            </div>
            <div class="modal-detail-item">
                <strong>Registrations:</strong>
                <span>${registrations.length}/${event.maxParticipants}</span>
            </div>
        `;
        
        eventModal.style.display = 'block';
    }
    
    function registerForEvent(eventId) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            showAlert('Please login to register!', 'danger');
            window.location.href = 'login.html';
            return;
        }
        
        const event = getEvents().find(e => e.id === eventId);
        const registrations = getRegistrations();
        
        if (registrations.find(r => r.eventId === eventId && r.userId === currentUser.id)) {
            showAlert('Already registered for this event!', 'danger');
            return;
        }
        
        if (registrations.filter(r => r.eventId === eventId).length >= event.maxParticipants) {
            showAlert('Event is full!', 'danger');
            return;
        }
        
        const registration = {
            id: generateId('reg_'),
            eventId: eventId,
            eventTitle: event.title,
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            userPhone: currentUser.phone,
            registeredAt: new Date().toISOString(),
            qrCode: generateId('qr_')
        };
        
        registrations.push(registration);
        saveRegistrations(registrations);
        
        showRegistrationSuccess(registration);
    }
    
    function showRegistrationSuccess(registration) {
        const modalBody = document.getElementById('registrationBody');
        modalBody.innerHTML = `
            <div class="registration-success">
                <h3>Registration Successful!</h3>
                <p>Event: ${registration.eventTitle}</p>
                <p>Your unique QR code:</p>
                <canvas id="qrCanvas"></canvas>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">Registration ID: ${registration.id}</p>
                <button class="btn-primary" onclick="window.print()">Print QR Code</button>
            </div>
        `;
        
        registrationModal.style.display = 'block';
        
        setTimeout(() => {
            generateQRCode(registration.id + registration.qrCode, 'qrCanvas');
        }, 100);
        
        displayEvents();
    }
    
    function deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        let events = getEvents();
        events = events.filter(e => e.id !== eventId);
        saveEvents(events);
        
        let registrations = getRegistrations();
        registrations = registrations.filter(r => r.eventId !== eventId);
        saveRegistrations(registrations);
        
        showAlert('Event deleted successfully!');
        displayEvents();
    }
    
    function viewEventRegistrations(eventId) {
        const event = getEvents().find(e => e.id === eventId);
        const registrations = getRegistrations().filter(r => r.eventId === eventId);
        
        const modalBody = document.getElementById('modalBody');
        
        if (registrations.length === 0) {
            modalBody.innerHTML = '<p>No registrations yet.</p>';
        } else {
            let html = '<h3>Registered Participants</h3>';
            html += '<div style="max-height: 400px; overflow-y: auto;">';
            registrations.forEach(reg => {
                html += `
                    <div style="border-bottom: 1px solid var(--border-color); padding: 1rem 0;">
                        <p><strong>Name:</strong> ${reg.userName}</p>
                        <p><strong>Email:</strong> ${reg.userEmail}</p>
                        <p><strong>Phone:</strong> ${reg.userPhone}</p>
                        <p><strong>Registered:</strong> ${new Date(reg.registeredAt).toLocaleString()}</p>
                    </div>
                `;
            });
            html += '</div>';
            modalBody.innerHTML = html;
        }
        
        eventModal.style.display = 'block';
    }
    
    // Create Event
    if (createEventBtn) {
        createEventBtn.addEventListener('click', () => {
            const currentUser = getCurrentUser();
            if (!currentUser || currentUser.role !== 'organizer') {
                showAlert('Only organizers can create events!', 'danger');
                return;
            }
            createEventModal.style.display = 'block';
        });
    }
    
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentUser = getCurrentUser();
            
            const newEvent = {
                id: generateId('event_'),
                title: document.getElementById('eventTitle').value.trim(),
                category: document.getElementById('eventCategory').value,
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value,
                location: document.getElementById('eventLocation').value.trim(),
                description: document.getElementById('eventDescription').value.trim(),
                maxParticipants: parseInt(document.getElementById('eventMaxParticipants').value),
                organizerId: currentUser.id,
                organizerName: currentUser.name,
                createdAt: new Date().toISOString()
            };
            
            const events = getEvents();
            events.push(newEvent);
            saveEvents(events);
            
            showAlert('Event created successfully!');
            createEventModal.style.display = 'none';
            createEventForm.reset();
            displayEvents();
        });
    }
    
    // Search and Filter
    if (searchInput) {
        searchInput.addEventListener('input', displayEvents);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', displayEvents);
    }
    
    // Modal Close
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    displayEvents();
}

// Admin Dashboard
if (window.location.pathname.endsWith('admin.html')) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('Access denied! Admin only.', 'danger');
        window.location.href = 'index.html';
    }
    
    function loadDashboardStats() {
        const users = getUsers();
        const events = getEvents();
        const registrations = getRegistrations();
        const organizers = users.filter(u => u.role === 'organizer');
        
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalEvents').textContent = events.length;
        document.getElementById('totalRegistrations').textContent = registrations.length;
        document.getElementById('totalOrganizers').textContent = organizers.length;
    }
    
    function loadEventsTable() {
        const events = getEvents();
        const tbody = document.getElementById('eventsTableBody');
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No events found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        events.forEach(event => {
            const registrations = getRegistrations().filter(r => r.eventId === event.id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event.id}</td>
                <td>${event.title}</td>
                <td>${event.category}</td>
                <td>${event.date}</td>
                <td>${event.organizerName}</td>
                <td>${registrations.length}/${event.maxParticipants}</td>
                <td>
                    <button class="btn-danger btn-small delete-event-admin" data-event-id="${event.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.delete-event-admin').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                if (confirm('Are you sure you want to delete this event?')) {
                    let events = getEvents();
                    events = events.filter(ev => ev.id !== eventId);
                    saveEvents(events);
                    
                    let registrations = getRegistrations();
                    registrations = registrations.filter(r => r.eventId !== eventId);
                    saveRegistrations(registrations);
                    
                    showAlert('Event deleted successfully!');
                    loadEventsTable();
                    loadDashboardStats();
                }
            });
        });
    }
    
    function loadRegistrationsTable() {
        const registrations = getRegistrations();
        const tbody = document.getElementById('registrationsTableBody');
        
        if (registrations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No registrations found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        registrations.forEach(reg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reg.id}</td>
                <td>${reg.userName}</td>
                <td>${reg.userEmail}</td>
                <td>${reg.userPhone}</td>
                <td>${reg.eventTitle}</td>
                <td>${new Date(reg.registeredAt).toLocaleDateString()}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    function loadUsersTable() {
        const users = getUsers();
        const tbody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                <td>
                    ${user.role !== 'admin' ? `<button class="btn-danger btn-small delete-user" data-user-id="${user.id}">Delete</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                if (confirm('Are you sure you want to delete this user?')) {
                    let users = getUsers();
                    users = users.filter(u => u.id !== userId);
                    saveUsers(users);
                    
                    showAlert('User deleted successfully!');
                    loadUsersTable();
                    loadDashboardStats();
                }
            });
        });
    }
    
    function exportToCSV(data, filename) {
        if (data.length === 0) {
            showAlert('No data to export!', 'danger');
            return;
        }
        
        const headers = Object.keys(data[0]);
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csv += values.join(',') + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    document.getElementById('exportEventsBtn').addEventListener('click', () => {
        const events = getEvents();
        exportToCSV(events, 'events.csv');
    });
    
    document.getElementById('exportRegistrationsBtn').addEventListener('click', () => {
        const registrations = getRegistrations();
        exportToCSV(registrations, 'registrations.csv');
    });
    
    document.getElementById('exportUsersBtn').addEventListener('click', () => {
        const users = getUsers();
        exportToCSV(users, 'users.csv');
    });
    
    loadDashboardStats();
    loadEventsTable();
    loadRegistrationsTable();
    loadUsersTable();
}

// Initialize on page load
updateNavigation();
>>>>>>> 1c35a0396a798108d93d237cff4cbcb526df7938
setupLogout();
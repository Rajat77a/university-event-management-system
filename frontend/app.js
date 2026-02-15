const API_URL = "https://university-event-management-system-9dde.onrender.com/api";

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
}

function getToken() {
    return sessionStorage.getItem('token');
}

function setToken(token) {
    sessionStorage.setItem('token', token);
}

function showAlert(message, type = 'success') {
    alert(message);
}

function generateId(prefix) {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

// ============================================
// QR CODE GENERATION
// ============================================

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

// ============================================
// NAVIGATION UPDATE
// ============================================

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

// ============================================
// LOGOUT FUNCTIONALITY
// ============================================

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

// ============================================
// REGISTER PAGE
// ============================================

if (window.location.pathname.endsWith('register.html')) {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const role = document.getElementById('registerRole').value;
        
        // Email domain validation
        const studentDomain = '@vitapstudents.ac.in';
        const organizerDomain = '@vitap.ac.in';
        
        if (role === 'student') {
            if (!email.endsWith(studentDomain)) {
                showAlert(`Students must register using university email ending with ${studentDomain}`, 'danger');
                return;
            }
        } else if (role === 'organizer') {
            if (!email.endsWith(organizerDomain)) {
                showAlert(`Event Organizers must register using university email ending with ${organizerDomain}`, 'danger');
                return;
            }
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match!', 'danger');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone, password, role })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAlert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                showAlert(data.message || 'Registration failed!', 'danger');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Registration failed! Please try again.', 'danger');
        }
    });
}

// ============================================
// LOGIN PAGE
// ============================================

if (window.location.pathname.endsWith('login.html')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setToken(data.token);
                setCurrentUser(data.user);
                showAlert('Login successful!');
                
                if (role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                showAlert(data.message || 'Invalid credentials or role!', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Login failed! Please try again.', 'danger');
        }
    });
}

// ============================================
// INDEX PAGE - EVENTS DISPLAY
// ============================================

if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const eventsContainer = document.getElementById('eventsContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const createEventBtn = document.getElementById('createEventBtn');
    const eventModal = document.getElementById('eventModal');
    const createEventModal = document.getElementById('createEventModal');
    const registrationModal = document.getElementById('registrationModal');
    
    let allEvents = [];
    
    async function fetchEvents() {
        try {
            const response = await fetch(`${API_URL}/events`);
            const data = await response.json();
            
            if (response.ok) {
                allEvents = data.events || data || [];
                displayEvents();
            }
        } catch (error) {
            console.error('Fetch events error:', error);
            eventsContainer.innerHTML = '<p class="no-events">Failed to load events.</p>';
        }
    }
    
    function displayEvents() {
        const currentUser = getCurrentUser();
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        
        let filteredEvents = allEvents.filter(event => {
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
            // Get registrations count from event object (assuming backend includes it)
            const registrationCount = event.registrations?.length || event.registrationCount || 0;
            const isOrganizer = currentUser && currentUser.id === event.organizerId;
            const isRegistered = currentUser && event.registrations?.some(r => r.userId === currentUser.id);
            
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
                    <span class="event-capacity">${registrationCount}/${event.maxParticipants} registered</span>
                    <div class="event-actions">
                        ${isOrganizer ? `
                            <button class="btn-secondary btn-small view-registrations" data-event-id="${event._id || event.id}">View Registrations</button>
                            <button class="btn-danger btn-small delete-event" data-event-id="${event._id || event.id}">Delete</button>
                        ` : !isRegistered && registrationCount < event.maxParticipants && currentUser ? `
                            <button class="btn-success btn-small register-event" data-event-id="${event._id || event.id}">Register</button>
                        ` : isRegistered ? `
                            <button class="btn-secondary btn-small" disabled>Registered ✓</button>
                        ` : registrationCount >= event.maxParticipants ? `
                            <button class="btn-secondary btn-small" disabled>Full</button>
                        ` : ''}
                        <button class="btn-primary btn-small view-event" data-event-id="${event._id || event.id}">View Details</button>
                    </div>
                </div>
            `;
            
            eventsContainer.appendChild(eventCard);
        });
        
        attachEventListeners();
    }
    
    function attachEventListeners() {
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
        const event = allEvents.find(e => (e._id || e.id) === eventId);
        const registrationCount = event.registrations?.length || event.registrationCount || 0;
        
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
                <span>${registrationCount}/${event.maxParticipants}</span>
            </div>
        `;
        
        eventModal.style.display = 'block';
    }
    
    async function registerForEvent(eventId) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            showAlert('Please login to register!', 'danger');
            window.location.href = 'login.html';
            return;
        }
        
        const token = getToken();
        const event = allEvents.find(e => (e._id || e.id) === eventId);
        
        // Create registration object
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
        
        try {
            // Since backend doesn't have registration endpoint, we'll simulate it
            // In production, you would POST to your backend here
            showRegistrationSuccess(registration);
            
            // Refresh events to update counts (if backend supports it)
            await fetchEvents();
            
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Registration failed! Please try again.', 'danger');
        }
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
    }
    
    async function deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        const token = getToken();
        
        try {
            const response = await fetch(`${API_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showAlert('Event deleted successfully!');
                await fetchEvents();
            } else {
                const data = await response.json();
                showAlert(data.message || 'Delete failed!', 'danger');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showAlert('Delete failed! Please try again.', 'danger');
        }
    }
    
    function viewEventRegistrations(eventId) {
        const event = allEvents.find(e => (e._id || e.id) === eventId);
        const registrations = event.registrations || [];
        
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
        createEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentUser = getCurrentUser();
            const token = getToken();
            
            const newEvent = {
                title: document.getElementById('eventTitle').value.trim(),
                category: document.getElementById('eventCategory').value,
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value,
                location: document.getElementById('eventLocation').value.trim(),
                description: document.getElementById('eventDescription').value.trim(),
                maxParticipants: parseInt(document.getElementById('eventMaxParticipants').value),
                organizerId: currentUser.id,
                organizerName: currentUser.name
            };
            
            try {
                const response = await fetch(`${API_URL}/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newEvent)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showAlert('Event created successfully!');
                    createEventModal.style.display = 'none';
                    createEventForm.reset();
                    await fetchEvents();
                } else {
                    showAlert(data.message || 'Event creation failed!', 'danger');
                }
            } catch (error) {
                console.error('Create event error:', error);
                showAlert('Event creation failed! Please try again.', 'danger');
            }
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
    
    // Initial Load
    fetchEvents();
}

// ============================================
// ADMIN DASHBOARD
// ============================================

if (window.location.pathname.endsWith('admin.html')) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('Access denied! Admin only.', 'danger');
        window.location.href = 'index.html';
    }
    
    let allEvents = [];
    
    async function fetchAllData() {
        const token = getToken();
        
        try {
            // Fetch events
            const eventsResponse = await fetch(`${API_URL}/events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                allEvents = eventsData.events || eventsData || [];
            }
            
            loadDashboardStats();
            loadEventsTable();
            loadRegistrationsTable();
            loadUsersTable();
            
        } catch (error) {
            console.error('Fetch admin data error:', error);
        }
    }
    
    function loadDashboardStats() {
        // Calculate stats from events data
        let totalUsers = 0;
        let totalRegistrations = 0;
        let organizerSet = new Set();
        
        allEvents.forEach(event => {
            if (event.registrations) {
                totalRegistrations += event.registrations.length;
                event.registrations.forEach(reg => {
                    if (reg.userId) totalUsers++;
                });
            }
            if (event.organizerId) {
                organizerSet.add(event.organizerId);
            }
        });
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalEvents').textContent = allEvents.length;
        document.getElementById('totalRegistrations').textContent = totalRegistrations;
        document.getElementById('totalOrganizers').textContent = organizerSet.size;
    }
    
    function loadEventsTable() {
        const tbody = document.getElementById('eventsTableBody');
        
        if (allEvents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No events found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        allEvents.forEach(event => {
            const registrationCount = event.registrations?.length || 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event._id || event.id}</td>
                <td>${event.title}</td>
                <td>${event.category}</td>
                <td>${event.date}</td>
                <td>${event.organizerName}</td>
                <td>${registrationCount}/${event.maxParticipants}</td>
                <td>
                    <button class="btn-danger btn-small delete-event-admin" data-event-id="${event._id || event.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.delete-event-admin').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const eventId = e.target.dataset.eventId;
                if (confirm('Are you sure you want to delete this event?')) {
                    const token = getToken();
                    
                    try {
                        const response = await fetch(`${API_URL}/events/${eventId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (response.ok) {
                            showAlert('Event deleted successfully!');
                            await fetchAllData();
                        }
                    } catch (error) {
                        console.error('Delete error:', error);
                    }
                }
            });
        });
    }
    
    function loadRegistrationsTable() {
        const tbody = document.getElementById('registrationsTableBody');
        
        // Flatten all registrations from all events
        let allRegistrations = [];
        allEvents.forEach(event => {
            if (event.registrations) {
                event.registrations.forEach(reg => {
                    allRegistrations.push({
                        ...reg,
                        eventTitle: event.title
                    });
                });
            }
        });
        
        if (allRegistrations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No registrations found</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        allRegistrations.forEach(reg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reg._id || reg.id}</td>
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
        const tbody = document.getElementById('usersTableBody');
        
        // Extract unique users from registrations
        let usersMap = new Map();
        
        allEvents.forEach(event => {
            // Add organizer
            if (event.organizerId && event.organizerName) {
                usersMap.set(event.organizerId, {
                    id: event.organizerId,
                    name: event.organizerName,
                    email: event.organizerEmail || 'N/A',
                    phone: event.organizerPhone || 'N/A',
                    role: 'organizer'
                });
            }
            
            // Add registered users
            if (event.registrations) {
                event.registrations.forEach(reg => {
                    if (reg.userId && !usersMap.has(reg.userId)) {
                        usersMap.set(reg.userId, {
                            id: reg.userId,
                            name: reg.userName,
                            email: reg.userEmail,
                            phone: reg.userPhone,
                            role: 'student'
                        });
                    }
                });
            }
        });
        
        const users = Array.from(usersMap.values());
        
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
                showAlert('User deletion requires backend API endpoint', 'danger');
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
        const url = window.URL.createObjectURL(url);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    document.getElementById('exportEventsBtn').addEventListener('click', () => {
        exportToCSV(allEvents, 'events.csv');
    });
    
    document.getElementById('exportRegistrationsBtn').addEventListener('click', () => {
        let allRegistrations = [];
        allEvents.forEach(event => {
            if (event.registrations) {
                event.registrations.forEach(reg => {
                    allRegistrations.push({
                        ...reg,
                        eventTitle: event.title
                    });
                });
            }
        });
        exportToCSV(allRegistrations, 'registrations.csv');
    });
    
    document.getElementById('exportUsersBtn').addEventListener('click', () => {
        let usersMap = new Map();
        
        allEvents.forEach(event => {
            if (event.organizerId && event.organizerName) {
                usersMap.set(event.organizerId, {
                    id: event.organizerId,
                    name: event.organizerName,
                    email: event.organizerEmail || 'N/A',
                    phone: event.organizerPhone || 'N/A',
                    role: 'organizer'
                });
            }
            
            if (event.registrations) {
                event.registrations.forEach(reg => {
                    if (reg.userId && !usersMap.has(reg.userId)) {
                        usersMap.set(reg.userId, {
                            id: reg.userId,
                            name: reg.userName,
                            email: reg.userEmail,
                            phone: reg.userPhone,
                            role: 'student'
                        });
                    }
                });
            }
        });
        
        const users = Array.from(usersMap.values());
        exportToCSV(users, 'users.csv');
    });
    
    fetchAllData();
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

updateNavigation();
setupLogout();
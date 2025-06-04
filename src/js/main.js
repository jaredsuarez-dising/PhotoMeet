import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const userMenu = document.getElementById('userMenu');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const featuredEvents = document.getElementById('featuredEvents');

// Modal instances
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

// Check auth status and load featured events on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadFeaturedEvents();
});

// Load featured events
async function loadFeaturedEvents() {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*, users(name)')
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true })
            .limit(3);

        if (error) throw error;

        displayFeaturedEvents(events);
    } catch (error) {
        console.error('Error loading featured events:', error);
        featuredEvents.innerHTML = '<div class="col-12 text-center">Error al cargar los eventos destacados</div>';
    }
}

// Display featured events
function displayFeaturedEvents(events) {
    if (events.length === 0) {
        featuredEvents.innerHTML = '<div class="col-12 text-center">No hay eventos destacados</div>';
        return;
    }

    featuredEvents.innerHTML = events.map(event => `
        <div class="col-md-4 mb-4">
            <div class="card event-card h-100">
                <img src="${event.image_url}" class="card-img-top" alt="${event.title}">
                <div class="card-body">
                    <h5 class="card-title">${event.title}</h5>
                    <p class="card-text">${event.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${formatDate(event.date)}</small>
                        <button class="btn btn-primary btn-sm" onclick="viewEvent(${event.id})">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// View event details
window.viewEvent = async (eventId) => {
    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*, users(name)')
            .eq('id', eventId)
            .single();

        if (error) throw error;

        // Create and show modal
        const modalHtml = `
            <div class="modal fade" id="eventDetailsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${event.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <img src="${event.image_url}" class="img-fluid rounded mb-3" alt="${event.title}">
                            <p>${event.description}</p>
                            <p class="text-muted">
                                <i class="fas fa-calendar"></i> ${formatDate(event.date)}
                                <br>
                                <i class="fas fa-map-marker-alt"></i> ${event.location}
                                <br>
                                <i class="fas fa-user"></i> Organizado por ${event.users.name}
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <a href="/eventos.html" class="btn btn-primary">Ver más eventos</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('eventDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading event details:', error);
        alert('Error al cargar los detalles del evento');
    }
};

// Check authentication status
async function checkAuthStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        showUserMenu(user);
    } else {
        showAuthButtons();
    }
}

// Show user menu when logged in
function showUserMenu(user) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    
    if (userMenu) {
        userMenu.style.display = 'block';
        userMenu.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    ${user.email}
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="logout()">Cerrar Sesión</a></li>
                </ul>
            </div>
        `;
    }
}

// Show auth buttons when logged out
function showAuthButtons() {
    loginBtn.style.display = 'block';
    registerBtn.style.display = 'block';
    if (userMenu) {
        userMenu.style.display = 'none';
    }
}

// Handle login button click
loginBtn.addEventListener('click', () => {
    loginModal.show();
});

// Handle register button click
registerBtn.addEventListener('click', () => {
    registerModal.show();
});

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        loginModal.hide();
        checkAuthStatus();
        alert('Inicio de sesión exitoso');
    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
});

// Handle register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        // 1. Register user with Supabase Auth
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (authError) throw authError;

        const user = data.user;

        // 2. Insert user data into public.users table
        if (user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    { id: user.id, name: name, email: email }
                ]);

            if (dbError) {
                // Log the error but allow auth registration to proceed
                console.error('Error inserting user into public.users:', dbError);
                // Optionally, you might want to alert the user or handle this case differently
                // alert('Registro de autenticación exitoso, pero hubo un error al guardar información adicional.');
            }
        }

        registerModal.hide();
        // Check if email confirmation is required by Supabase settings
        if (user && !user.identities.some(identity => identity.provider === 'email' && identity.identity_data.email_verified)) {
             alert('Registro exitoso. Por favor verifica tu email antes de iniciar sesión.');
        } else {
             alert('Registro exitoso.');
        }

    } catch (error) {
        alert('Error al registrarse: ' + error.message);
    }
});

// Handle logout
window.logout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        checkAuthStatus();
        alert('Sesión cerrada correctamente');
    } catch (error) {
        alert('Error al cerrar sesión: ' + error.message);
    }
};

// Helper function to format dates
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        checkAuthStatus();
    } else if (event === 'SIGNED_OUT') {
        checkAuthStatus();
    }
}); 
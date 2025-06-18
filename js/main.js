import supabase from './supabaseClient';
import { checkAuthStatus } from './auth';
import './auth'; // Import auth.js to run the onAuthStateChange listener
import { showLoading, hideLoading, showToast, debounceButton } from './utils';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const userMenu = document.getElementById('userMenu');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const registerSubmitBtn = document.getElementById('registerSubmitBtn');
const featuredEvents = document.getElementById('featuredEvents');

// Modal instances
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

// Check auth status and load featured events on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadFeaturedEvents();
});

// Handle login button click
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.show();
    });
}

// Handle register button click
if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        registerModal.show();
    });
}

// Handle login form submission with debounce
if (loginSubmitBtn) {
    debounceButton(loginSubmitBtn, async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        showLoading('Iniciando sesión...');
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            loginModal.hide();
            showToast('Inicio de sesión exitoso');
            // checkAuthStatus is handled by auth.js listener
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
}

// Handle register form submission with debounce
if (registerSubmitBtn) {
    debounceButton(registerSubmitBtn, async (e) => {
        e.preventDefault();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        showLoading('Registrando usuario...');
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
                    console.error('Error inserting user into public.users:', dbError);
                }
            }

            registerModal.hide();
            // Check if email confirmation is required by Supabase settings
            if (user && user.identities && !user.identities.some(identity => identity.provider === 'email' && identity.identity_data.email_verified)) {
                showToast('Registro exitoso. Por favor verifica tu email antes de iniciar sesión.');
            } else {
                showToast('Registro exitoso.');
            }

        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
}

// Load featured events
async function loadFeaturedEvents() {
    if (!featuredEvents) return;

    showLoading('Cargando eventos destacados...');
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true })
            .limit(3);

        if (error) throw error;

        featuredEvents.innerHTML = events.map(event => `
            <div class="col-md-4">
                <div class="card h-100">
                    ${event.image_url ? `<img src="${event.image_url}" class="card-img-top" alt="${event.title}">` : ''}
                    <div class="card-body">
                        <h5 class="card-title">${event.title}</h5>
                        <p class="card-text">${event.description}</p>
                        <p class="card-text"><small class="text-muted">${formatDate(event.date)}</small></p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured events:', error);
        showToast('Error al cargar eventos destacados', 'error');
    } finally {
        hideLoading();
    }
}

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
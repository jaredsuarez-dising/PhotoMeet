import supabase from './supabaseClient';
import { checkAuthStatus } from './auth';
import './auth'; // Import auth.js to run the onAuthStateChange listener

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

    featuredEvents.innerHTML = events.map(event => {
        const imageUrl = event.image_url ? 
            `https://yqtsrbtgfpbkrnrcwnnf.supabase.co/storage/v1/object/public/event-images/${event.image_url}` : 
            '[URL_IMAGEN_POR_DEFECTO]'; // Replace with a default image URL if needed

        return `
        <div class="col-md-4 mb-4">
            <div class="card event-card h-100">
                <img src="${imageUrl}" class="card-img-top" alt="${event.title}">
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
    `;
    }).join('');
}

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

// Handle login form submission
if (loginForm) {
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
            // checkAuthStatus is handled by auth.js listener
            alert('Inicio de sesión exitoso');
        } catch (error) {
            alert('Error al iniciar sesión: ' + error.message);
        }
    });
}

// Handle register form submission
if (registerForm) {
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
            if (user && user.identities && !user.identities.some(identity => identity.provider === 'email' && identity.identity_data.email_verified)) {
                 alert('Registro exitoso. Por favor verifica tu email antes de iniciar sesión.');
            } else {
                 alert('Registro exitoso.');
            }

        } catch (error) {
            alert('Error al registrarse: ' + error.message);
        }
    });
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
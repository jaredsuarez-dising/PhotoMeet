import supabase from './supabaseClient';

// Auth DOM Elements (assuming these IDs are consistent across pages)
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const userMenu = document.getElementById('userMenu');

// Check authentication status
export async function checkAuthStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        showUserMenu(user);
    } else {
        showAuthButtons();
    }
}

// Show user menu when logged in
function showUserMenu(user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    
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
    // You might need to handle the visibility of createEventBtn here if it's part of auth state
    const createEventBtn = document.getElementById('createEventBtn');
    if (createEventBtn) createEventBtn.style.display = 'block';
}

// Show auth buttons when logged out
function showAuthButtons() {
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
    // You might need to handle the visibility of createEventBtn here if it's part of auth state
    const createEventBtn = document.getElementById('createEventBtn');
    if (createEventBtn) createEventBtn.style.display = 'none';
}

// Handle logout - defined globally for onclick in HTML
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

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('Auth state change: SIGNED_IN');
        checkAuthStatus();
    } else if (event === 'SIGNED_OUT') {
        console.log('Auth state change: SIGNED_OUT');
        checkAuthStatus();
    }
}); 
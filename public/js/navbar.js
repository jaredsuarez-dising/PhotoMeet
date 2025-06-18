// Función para cargar el navbar
function loadNavbar() {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) return;

    // Crear el navbar directamente
    const nav = document.createElement('nav');
    nav.className = 'navbar navbar-expand-lg navbar-dark bg-dark';
    nav.innerHTML = `
        <div class="container">
            <a class="navbar-brand" href="index.html">PhotoMeet</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="index.html">Inicio</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="calendario.html">Calendario</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="eventos.html">Eventos</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="profile.html">Perfil</a>
                    </li>
                </ul>
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <button class="btn btn-link nav-link" onclick="toggleTheme()">
                            <i class="bi bi-moon-stars"></i>
                        </button>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="handleLogout()">
                            <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    `;

    // Limpiar el contenedor y agregar el navbar
    navbarContainer.innerHTML = '';
    navbarContainer.appendChild(nav);

    // Inicializar el tema
    if (typeof initializeTheme === 'function') {
        initializeTheme();
    }
}

// Cargar el navbar inmediatamente
loadNavbar(); 


window.handleLogout = async function() {
    if (window.supabase && window.supabase.auth) {
        try {
            const { error } = await window.supabase.auth.signOut();
            if (error) throw error;
            window.location.href = 'login.html';
        } catch (err) {
            alert('Error al cerrar sesión: ' + (err.message || err));
        }
    } else {
        alert('Supabase no está inicializado');
    }
};
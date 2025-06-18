// Función para cargar el navbar
function loadNavbar() {
    console.log('Intentando cargar el navbar...');
    const navbarContainer = document.getElementById('navbar-container');
    
    if (!navbarContainer) {
        console.error('No se encontró el contenedor del navbar');
        return;
    }

    console.log('Contenedor del navbar encontrado, insertando HTML...');

    // HTML del navbar
    const navbarHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
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
        </nav>
    `;

    try {
        // Insertar el navbar
        navbarContainer.innerHTML = navbarHTML;
        console.log('Navbar insertado correctamente');

        // Inicializar el tema después de cargar el navbar
        if (typeof initializeTheme === 'function') {
            console.log('Inicializando tema...');
            initializeTheme();
        } else {
            console.warn('La función initializeTheme no está disponible');
        }
    } catch (error) {
        console.error('Error al insertar el navbar:', error);
    }
}

// Asegurarnos de que el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
} else {
    loadNavbar();
} 
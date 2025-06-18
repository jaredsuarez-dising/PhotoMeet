// Función para cargar el navbar
function loadNavbar() {
    const navbarContainer = document.getElementById('navbar-container');
    if (!navbarContainer) {
        console.error('No se encontró el contenedor del navbar');
        return;
    }

    // Crear un objeto para cargar el navbar
    const navbarObject = document.createElement('object');
    navbarObject.data = 'components/navbar.html';
    navbarObject.type = 'text/html';
    navbarObject.style.width = '100%';
    navbarObject.style.border = 'none';
    
    // Manejar la carga exitosa
    navbarObject.onload = function() {
        try {
            // Obtener el contenido del navbar
            const navbarContent = navbarObject.contentDocument.body.innerHTML;
            navbarContainer.innerHTML = navbarContent;
            
            // Inicializar el tema después de cargar el navbar
            if (typeof initializeTheme === 'function') {
                initializeTheme();
            }
        } catch (error) {
            console.error('Error al procesar el navbar:', error);
            showFallbackNavbar();
        }
    };

    // Manejar errores
    navbarObject.onerror = function() {
        console.error('Error al cargar el navbar');
        showFallbackNavbar();
    };

    // Agregar el objeto al contenedor
    navbarContainer.appendChild(navbarObject);
}

// Función para mostrar el navbar de respaldo
function showFallbackNavbar() {
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        navbarContainer.innerHTML = `
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
    }
}

// Cargar el navbar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadNavbar); 
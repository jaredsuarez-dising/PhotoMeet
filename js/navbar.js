// Función para cargar el navbar
async function loadNavbar() {
    try {
        // Obtener la ruta base del proyecto
        const basePath = window.location.pathname.includes('/src/') ? '/src' : '';
        
        // Intentar cargar el navbar
        const response = await fetch(`${basePath}/components/navbar.html`);
        if (!response.ok) {
            throw new Error('Error al cargar el navbar');
        }
        
        const html = await response.text();
        const navbarContainer = document.getElementById('navbar-container');
        
        if (navbarContainer) {
            navbarContainer.innerHTML = html;
            
            // Inicializar el tema después de cargar el navbar
            if (typeof initializeTheme === 'function') {
                initializeTheme();
            }
        } else {
            console.error('No se encontró el contenedor del navbar');
        }
    } catch (error) {
        console.error('Error al cargar el navbar:', error);
        // Mostrar un navbar básico como fallback
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
                        </div>
                    </div>
                </nav>
            `;
        }
    }
}

// Cargar el navbar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadNavbar); 
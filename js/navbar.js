// Función para cargar el navbar
async function loadNavbar() {
    try {
        // Intentar diferentes rutas posibles
        const possiblePaths = [
            './components/navbar.html',
            '/components/navbar.html',
            '../components/navbar.html',
            'components/navbar.html'
        ];

        let response = null;
        let html = null;

        // Intentar cada ruta hasta que una funcione
        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) {
                    html = await response.text();
                    break;
                }
            } catch (e) {
                console.log(`Ruta ${path} no funcionó, intentando siguiente...`);
                continue;
            }
        }

        if (!html) {
            throw new Error('No se pudo cargar el navbar desde ninguna ruta');
        }

        // Insertar el navbar
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
        // Mostrar un mensaje de error en la página
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
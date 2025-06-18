// Función para cargar el navbar
async function loadNavbar() {
    try {
        const response = await fetch('/components/navbar.html');
        const html = await response.text();
        document.getElementById('navbar-container').innerHTML = html;
    } catch (error) {
        console.error('Error al cargar el navbar:', error);
    }
}

// Cargar el navbar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadNavbar); 
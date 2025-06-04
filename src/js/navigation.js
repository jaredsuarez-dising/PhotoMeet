// Función para actualizar el estado activo del navbar
function updateActiveNavItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
            link.classList.add('active');
        }
    });
}

// Función para cargar el perfil del usuario
async function loadUserProfile() {
    try {
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        const { data: user, error: userError } = await window.supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (userError) throw userError;

        // Actualizar elementos del perfil
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileImage = document.getElementById('profileImage');

        if (profileName) profileName.textContent = user.name || 'Usuario';
        if (profileEmail) profileEmail.textContent = session.user.email;
        if (profileImage) {
            profileImage.src = user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || 'Usuario');
        }

    } catch (error) {
        console.error('Error al cargar el perfil:', error);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    updateActiveNavItem();
    loadUserProfile();
}); 
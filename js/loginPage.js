import supabase from './supabaseClient.js';
import { showLoading, hideLoading } from './utils.js'; // Asumiendo que utils.js exporta estas

// Funciones de autenticación (copiadas del script inline en login.html)
async function handleLogin(event) {
    // Prevent default form submission
    if (event) event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    console.log('Attempting login with:', { email });

    setLoading('loginButton', true);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Assuming successful login redirects to index.html
        showAlert('Success', 'Inicio de sesión exitoso!', 'login');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000); // Short delay to show success message

    } catch (error) {
        console.error('Login error:', error);
        showAlert('Error', error.message || 'Error al iniciar sesión. Por favor, intenta nuevamente.', 'login');
    } finally {
        setLoading('loginButton', false);
    }
}

async function handleRegister(event) {
    // Prevent default form submission
     if (event) event.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value; // Assuming you have this input now

     if (password !== confirmPassword) {
         showAlert('Error', 'Las contraseñas no coinciden.', 'register');
         return; // Stop if passwords don't match
     }

    showLoading('Registrando usuario...');

    try {
        // 1. Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { // Metadata for auth user
                    name: name
                }
            }
        });

        if (authError) throw authError;

        // Después de un registro exitoso, obtener la sesión para asegurar que auth.uid() esté disponible
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = session?.user; // Usar el usuario de la sesión activa

        // Añadir un pequeño retardo para dar tiempo a Supabase a establecer el contexto de auth.uid()
        // para la política RLS antes de intentar la inserción en la tabla users.
        await new Promise(resolve => setTimeout(resolve, 100)); // Retardo de 100ms (ajustable si es necesario)

        // 2. Insert user data into public.users table
        // Esta inserción solo funcionará si el auth.uid() del usuario que realiza la solicitud
        // coincide con el 'id' que se está insertando, debido a la política RLS "Users can insert their own profile".
        if (user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    { id: user.id, name: name, email: email } // Usar el ID del usuario de la sesión
                ]);

            if (dbError) {
                console.error('Error inserting user into public.users:', dbError);
                // Si el error es RLS (42501), indica que el auth.uid() no coincidió o no estaba disponible.
                // La política RLS está configurada para permitir la inserción si auth.uid() == id.
                // Si este error persiste, puede haber un problema de propagación o configuración en Supabase.
                // Mostrar un mensaje que indica que el registro Auth fue exitoso pero hubo un problema con el perfil.
                showAlert('Error', 'Registro exitoso, pero hubo un problema al guardar tu perfil. Por favor, intenta iniciar sesión.', 'register');
                hideLoading();
                // No hacemos un return aquí para que continúe y muestre el mensaje de éxito general si auth.signUp fue exitoso.
                 // Sin embargo, esto puede ser confuso. Es mejor detenerse si la inserción del perfil falla.
                 // Revertiré el cambio de no hacer return.
                return; // Exit if DB insert fails
            } else {
                 // Inserción en public.users exitosa
                 showAlert('Success', '¡Registro exitoso! Por favor, inicia sesión.', 'register');

                 setTimeout(() => {
                      // Switch to login form after successful registration and delay
                     toggleForms();
                     // Clear register form and pre-fill login email
                     document.getElementById('registerForm').reset();
                     document.getElementById('loginEmail').value = email;
                     document.getElementById('loginPassword').value = ''; // Keep password field empty for security

                 }, 1500); // Short delay to show success message
            }
        } else {
             // Esto podría ocurrir si signUp no inicia sesión automáticamente y getSession no encuentra una.
             console.error('Registro exitoso en Auth, pero no se pudo obtener la sesión para insertar en users.');
             showAlert('Error', 'Registro exitoso, confirma tu correo electrónico para iniciar sesión.', 'register');
             hideLoading();
             return;
        }

    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Error', error.message || 'Error al registrar usuario. Por favor, intenta nuevamente.', 'register');
    } finally {
        hideLoading();
    }
}

// Function to toggle forms (assuming elements and classes are correct)
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        loginForm.classList.toggle('active');
        registerForm.classList.toggle('active');

        // Clear alert messages when switching forms
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.display = 'none';
            alert.textContent = '';
        });
    }
}

// Function to show alerts (assuming elements exist)
function showAlert(type, message, formId) {
    const alertElement = document.getElementById(`${formId}${type}`);
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }
}

// Function to show/hide loading state on buttons (assuming elements exist)
function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
}

// Check auth status on load (replace localStorage check with Supabase method)
window.addEventListener('load', async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session) {
        // If a session exists, redirect to index
        console.log('User already signed in, redirecting to index.html');
        window.location.href = 'index.html';
    } else {
        // Ensure login form is active by default if no session
        console.log('No active session, showing login form');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm && registerForm) {
             // Only set active class if no form is active yet (handle initial load)
            if (!loginForm.classList.contains('active') && !registerForm.classList.contains('active')) {
                 loginForm.classList.add('active');
            }
        }
    }
});

// Expose functions to the global window object so they can be called from inline HTML attributes (onclick, onsubmit)
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.toggleForms = toggleForms;
// If showAlert and setLoading are also used in inline HTML, expose them
window.showAlert = showAlert;
window.setLoading = setLoading;

// Note: handleLogout is likely defined in navigation.js and used via window.handleLogout
// If not, and it's needed here, define and expose it similarly. 
import supabase from './supabaseClient';
import { checkAuthStatus } from './auth';
import './auth'; // Import auth.js to run the onAuthStateChange listener
import { formatDate } from './utils'; // Import the utility function

// DOM Elements
const eventsList = document.getElementById('eventsList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterForm = document.getElementById('filterForm');
const createEventBtn = document.getElementById('createEventBtn');
const createEventForm = document.getElementById('createEventForm');
const submitEventBtn = document.getElementById('submitEvent');

// Auth DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const userMenu = document.getElementById('userMenu');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
filterForm.addEventListener('submit', handleFilter);
submitEventBtn.addEventListener('click', handleCreateEvent);

// Load events when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Hide auth elements initially to prevent flicker
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'none';
    if (createEventBtn) createEventBtn.style.display = 'none';

    loadEvents();
    checkAuthStatus();
});

// Load events from Supabase
async function loadEvents(filters = {}) {
    try {
        console.log('Cargando eventos con filtros:', filters);
        let query = supabase
            .from('events')
            .select('id, title, description, date, location, image_url')
            .order('date', { ascending: true });

        // Apply filters
        if (filters.date) {
            query = query.eq('date', filters.date);
        }
        if (filters.location) {
            query = query.ilike('location', `\%${filters.location}\%`);
        }
        if (filters.search) {
            query = query.or(`title.ilike.\%${filters.search}\%,description.ilike.\%${filters.search}\%`);
        }

        const { data: events, error } = await query;

        if (error) throw error;

        console.log('Eventos recuperados:', events);

        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        alert('Error al cargar los eventos: ' + error.message);
    }
}

// Display events in the list
function displayEvents(events) {
    eventsList.innerHTML = events.map(event => {
        const imageUrl = event.image_url ? 
            `https://yqtsrbtgfpbkrnrcwnnf.supabase.co/storage/v1/object/public/event-images/${event.image_url}` : 
            '[URL_IMAGEN_POR_DEFECTO]';

        return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card event-card h-100">
                <img src="${imageUrl}" class="card-img-top" alt="${event.title}" loading="lazy">
                <div class="card-body">
                    <h5 class="card-title">${event.title}</h5>
                    <p class="card-text">${event.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${formatDate(event.date)}</small>
                        <button class="btn btn-primary btn-sm" onclick="window.viewEvent(${event.id})">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    loadEvents({ search: searchTerm });
}

// Handle filters
function handleFilter(e) {
    e.preventDefault();
    const date = document.getElementById('dateFilter').value;
    const location = document.getElementById('locationFilter').value;
    loadEvents({ date, location });
}

// Handle event creation
async function handleCreateEvent() {
    console.log('Iniciando handleCreateEvent');
    const form = createEventForm;
    const formData = new FormData(form);
    console.log('FormData obtenido');

    try {
        // Validate required fields
        const title = formData.get('title');
        const description = formData.get('description');
        const date = formData.get('date');
        const location = formData.get('location');

        if (!title || !description || !date || !location) {
            alert('Por favor, complete todos los campos requeridos del formulario.');
            console.log('Campos requeridos faltantes');
            return;
        }
        console.log('Campos requeridos validados');

        let imageUrl = null;
        const imageFile = formData.get('image');
        console.log('Obtenido imageFile', imageFile);

        // Only upload image if one was provided
        if (imageFile && imageFile.name) {
            console.log('ImageFile presente, intentando subir imagen');
            const { data: imageData, error: imageError } = await supabase.storage
                .from('event-images')
                .upload(`${Date.now()}-${imageFile.name}`, imageFile);

            if (imageError) throw imageError;

            // Get the public URL after successful upload
            const { data: publicUrlData } = supabase.storage
                .from('event-images')
                .getPublicUrl(imageData.path);

            console.log('Resultado de getPublicUrl:', publicUrlData);

            imageUrl = publicUrlData.publicUrl;
            console.log('Imagen subida, URL pública:', imageUrl);
        }

        console.log('Antes de obtener usuario autenticado');
        // Get the current user's ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Resultado de getUser', { user, userError });

        if (userError) {
            console.error('Error getting user:', userError);
            alert('Error getting user: ' + userError.message);
            return;
        }
        if (!user) {
            alert('Error: User not authenticated.');
            console.log('Usuario no autenticado, retornando');
            return;
        }

        console.log('Usuario autenticado válido antes de insert:', user);

        // Create event
        const { data: event, error } = await supabase
            .from('events')
            .insert([{
                title: title,
                description: description,
                date: date,
                location: location,
                image_url: imageUrl,
                user_id: user.id
            }])
            .select();

        if (error) throw error;

        alert('Evento creado correctamente');
        bootstrap.Modal.getInstance(document.getElementById('createEventModal')).hide();
        form.reset(); // Reset the form after successful creation
        loadEvents(); // Reload events after creation

    } catch (error) {
        console.error('Error creating event:', error);
        alert('Error al crear el evento: ' + error.message);
    }
}

// Initialize AOS
AOS.init({
    duration: 800,
    once: true
});

// Make viewEvent available globally
window.viewEvent = async function(eventId) {
    console.log('viewEvent called with eventId:', eventId);
    try {
        console.log('Attempting to fetch event details for eventId:', eventId);
        const { data: event, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) {
            console.error('Error fetching event details:', error);
            alert('Error al cargar los detalles del evento');
            return; // Stop execution if event details fail
        }

        console.log('Event details fetched:', event);

        // Format the date
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Create the HTML content (This part seems to work based on the modal opening)
        const eventDetailsHtml = `
            <div class="event-details">
                <div class="event-image-container">
                    <img src="${event.image_url ? `https://yqtsrbtgfpbkrnrcwnnf.supabase.co/storage/v1/object/public/event-images/${event.image_url}` : '[URL_IMAGEN_POR_DEFECTO]'}" 
                         alt="${event.title}" 
                         class="img-fluid">
                </div>
                <div class="event-info">
                    <h3 class="mb-3">${event.title}</h3>
                    <div class="event-meta mb-3">
                        <p class="mb-2"><i class="fas fa-map-marker-alt me-2"></i> ${event.location}</p>
                        <p class="mb-2"><i class="fas fa-calendar-alt me-2"></i> ${formattedDate}</p>
                    </div>
                    <p class="mb-4">${event.description}</p>
                </div>
            </div>
            <div class="comments-section mt-4">
                <h4>Comentarios</h4>
                <div id="commentsList" class="mb-3">
                    <!-- Comments will be loaded here -->
                </div>
                <form id="commentForm" class="mt-3">
                    <div class="mb-3">
                        <textarea class="form-control" id="commentText" rows="3" placeholder="Escribe un comentario..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Publicar Comentario</button>
                </form>
            </div>
        `;

        // Update modal content
        document.getElementById('eventDetails').innerHTML = eventDetailsHtml;

        // Add event listener for comment form AFTER the HTML is added to the DOM
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
             commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                // eventId is available in the closure
                await handleCommentSubmit(eventId);
            });
        }

        console.log('Calling loadComments for eventId:', eventId);
        // Load comments
        await loadComments(eventId);

        // Show modal (This part also seems to work)
        const eventModal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
        eventModal.show();
    } catch (error) {
        console.error('Error in viewEvent (catch block):', error);
        alert('Error inesperado al ver el evento');
    }
};

// Function to load comments
async function loadComments(eventId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) {
        console.error('Comments list element not found');
        return;
    }

    try {
        console.log('Step 1: Fetching comments for event:', eventId);

        // Step 1: Fetch comments using only available columns
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('id, user_id, comment') // Select only existing columns: id, user_id, comment
            .eq('event_id', eventId)
            .order('id', { ascending: true }); // Order by ID as created_at is not available

        if (commentsError) {
            console.error('Error fetching comments:', commentsError.message, commentsError.details, commentsError.hint);
            commentsList.innerHTML = '<p class="text-danger">Error al cargar los comentarios: ' + commentsError.message + '</p>';
            return;
        }

        console.log('Step 1: Comments fetched raw:', comments);

        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<p class="text-muted">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
            return;
        }

        // Step 2: Get unique user IDs from comments
        const userIds = [...new Set(comments.map(comment => comment.user_id).filter(id => id !== null))];
        console.log('Step 2: Unique user IDs found:', userIds);

        let profiles = [];
        if (userIds.length > 0) {
            console.log('Step 2: Fetching profiles from table \'users\' for user IDs:', userIds);
            // Fetch profiles for these users from the 'users' table
            // Assumes your user table is named 'users' and has 'id' and 'name'
            const { data: fetchedProfiles, error: profilesError } = await supabase
                .from('users') // <-- Using 'users' as the table name based on your description
                .select('id, name') // <-- Selecting 'name' column for the username
                .in('id', userIds);

            if (profilesError) {
                console.error('Error fetching profiles from \'users\' table:', profilesError);
                // Continue even if profiles fail, just use default user info
            } else {
                profiles = fetchedProfiles || [];
            }
             console.log('Step 2: Profiles fetched:', profiles);
        }

        // Create a map of user profiles for easy lookup by user_id
        const profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
        }, {});
        console.log('Step 2: Profiles map created:', profilesMap);

        // Display comments using fetched data - show username (from 'name') and comment text
        commentsList.innerHTML = comments.map(comment => {
            const profile = profilesMap[comment.user_id] || {}; // Get profile from map, use empty object if not found
            // Use profile.name for the username as per your table schema
            const username = profile.name || 'Usuario Desconocido'; 
            const commentText = comment.comment || ''; // Use comment.comment

            return `
                <div class="comment mb-3">
                    <div class="d-flex align-items-start">
                        <!-- Avatar removed as requested -->
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">${username}</h6>
                                <!-- Date removed as requested -->
                            </div>
                            <p class="mb-0">${commentText}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading comments (catch block):', error);
        if (commentsList) {
            commentsList.innerHTML = '<p class="text-danger">Error inesperado al cargar los comentarios</p>';
        }
    }
}

// Function to handle comment submission - already uses 'comment' column
// Keep handleCommentSubmit as is from the previous step
async function handleCommentSubmit(eventId) {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            alert('Debes iniciar sesión para comentar');
            return;
        }

        const commentTextarea = document.getElementById('commentText');
        const commentContent = commentTextarea.value.trim();

        if (!commentContent) {
            alert('Por favor, escribe un comentario');
            return;
        }

        // Insert using 'comment' column name
        const { error } = await supabase
            .from('comments')
            .insert([{
                event_id: eventId,
                user_id: user.id,
                comment: commentContent // Use 'comment' column name
            }]);

        if (error) throw error;

        // Clear the form and reload comments
        commentTextarea.value = '';
        await loadComments(eventId); // Reload comments after successful submission
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Error al publicar el comentario');
    }
}
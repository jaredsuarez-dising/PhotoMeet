import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const eventsList = document.getElementById('eventsList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterForm = document.getElementById('filterForm');
const createEventBtn = document.getElementById('createEventBtn');
const createEventForm = document.getElementById('createEventForm');
const submitEventBtn = document.getElementById('submitEvent');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
filterForm.addEventListener('submit', handleFilter);
submitEventBtn.addEventListener('click', handleCreateEvent);

// Load events when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    checkAuthStatus();
});

// Check authentication status
async function checkAuthStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        createEventBtn.style.display = 'block';
    }
}

// Load events from Supabase
async function loadEvents(filters = {}) {
    try {
        let query = supabase
            .from('events')
            .select('*, users(name)')
            .order('date', { ascending: true });

        // Apply filters
        if (filters.date) {
            query = query.eq('date', filters.date);
        }
        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }
        if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const { data: events, error } = await query;

        if (error) throw error;

        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        alert('Error al cargar los eventos');
    }
}

// Display events in the list
function displayEvents(events) {
    eventsList.innerHTML = events.map(event => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card event-card h-100">
                <img src="${event.image_url}" class="card-img-top" alt="${event.title}">
                <div class="card-body">
                    <h5 class="card-title">${event.title}</h5>
                    <p class="card-text">${event.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${formatDate(event.date)}</small>
                        <button class="btn btn-primary btn-sm" onclick="viewEvent(${event.id})">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
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
    const form = createEventForm;
    const formData = new FormData(form);
    
    try {
        // Upload image first
        const imageFile = formData.get('image');
        const { data: imageData, error: imageError } = await supabase.storage
            .from('event-images')
            .upload(`${Date.now()}-${imageFile.name}`, imageFile);

        if (imageError) throw imageError;

        // Create event
        const { data: event, error } = await supabase
            .from('events')
            .insert([{
                title: formData.get('title'),
                description: formData.get('description'),
                date: formData.get('date'),
                location: formData.get('location'),
                image_url: imageData.path,
                user_id: (await supabase.auth.getUser()).data.user.id
            }]);

        if (error) throw error;

        alert('Evento creado correctamente');
        loadEvents();
        bootstrap.Modal.getInstance(document.getElementById('createEventModal')).hide();
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Error al crear el evento');
    }
}

// View event details
async function viewEvent(eventId) {
    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*, users(name)')
            .eq('id', eventId)
            .single();

        if (error) throw error;

        // Load comments
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('*, users(name)')
            .eq('event_id', eventId)
            .order('id', { ascending: false });

        if (commentsError) throw commentsError;

        // Show event details
        const modal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
        document.getElementById('eventDetails').innerHTML = `
            <div class="text-center mb-4">
                <img src="${event.image_url}" class="img-fluid rounded" alt="${event.title}">
            </div>
            <h4>${event.title}</h4>
            <p class="text-muted">
                <i class="fas fa-calendar"></i> ${formatDate(event.date)}
                <br>
                <i class="fas fa-map-marker-alt"></i> ${event.location}
                <br>
                <i class="fas fa-user"></i> Organizado por ${event.users.name}
            </p>
            <p>${event.description}</p>
            <hr>
            <h5>Comentarios</h5>
            <div class="comments-list">
                ${comments.map(comment => `
                    <div class="comment mb-3">
                        <strong>${comment.users.name}</strong>
                        <p>${comment.comment}</p>
                    </div>
                `).join('')}
            </div>
            <form id="commentForm" class="mt-3">
                <div class="mb-3">
                    <textarea class="form-control" placeholder="Escribe un comentario..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Comentar</button>
            </form>
        `;

        // Handle comment submission
        document.getElementById('commentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const comment = e.target.querySelector('textarea').value;
            
            try {
                const { error } = await supabase
                    .from('comments')
                    .insert([{
                        event_id: eventId,
                        user_id: (await supabase.auth.getUser()).data.user.id,
                        comment: comment
                    }]);

                if (error) throw error;

                alert('Comentario publicado');
                viewEvent(eventId); // Reload event details
            } catch (error) {
                console.error('Error posting comment:', error);
                alert('Error al publicar el comentario');
            }
        });

        modal.show();
    } catch (error) {
        console.error('Error loading event details:', error);
        alert('Error al cargar los detalles del evento');
    }
}

// Helper functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Initialize AOS
AOS.init({
    duration: 800,
    once: true
}); 
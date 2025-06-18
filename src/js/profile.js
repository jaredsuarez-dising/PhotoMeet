// Variables globales
let currentUser = null;
let eventModal = null;
let deleteEventModal = null;
let eventToDelete = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
    deleteEventModal = new bootstrap.Modal(document.getElementById('deleteEventModal'));
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    await checkAuth();
    loadUserEvents();
});

// Verificar autenticación
async function checkAuth() {
    const { data: { session }, error } = await window.supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = session.user;
}

// Cargar eventos del usuario
async function loadUserEvents() {
    try {
        const { data: events, error } = await window.supabase
            .from('events')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('userEventsContainer');
        container.innerHTML = '';

        if (events.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-calendar-x display-1 text-muted"></i>
                    <p class="mt-3">No tienes eventos creados</p>
                </div>
            `;
            return;
        }

        events.forEach(event => {
            const eventCardElement = createEventCard(event);
            container.appendChild(eventCardElement);
        });
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        showAlert('Error al cargar eventos', 'danger');
    }
}

// Crear tarjeta de evento
function createEventCard(event) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    // Formatear la fecha para mostrarla
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    col.innerHTML = `
        <div class="card event-card">
            ${event.image_url ? `
                <img src="${event.image_url}" class="card-img-top event-image" alt="${event.title}">
            ` : ''}
            <div class="card-body">
                <h5 class="card-title">${event.title}</h5>
                <p class="card-text">
                    <i class="bi bi-calendar"></i> ${formattedDate}<br>
                    <i class="bi bi-geo-alt"></i> ${event.location}
                </p>
                <p class="card-text">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-primary btn-sm" onclick="viewEventDetails('${event.id}')">
                        <i class="bi bi-eye"></i> Ver Detalles
                    </button>
                    <div>
                        <button class="btn btn-outline-primary btn-sm" onclick="editEvent('${event.id}')">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteEvent('${event.id}')">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Mostrar modal para nuevo evento
function showAddEventModal() {
    document.getElementById('modalTitle').textContent = 'Nuevo Evento';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    eventModal.show();
}

// Editar evento
async function editEvent(eventId) {
    try {
        const { data: event, error } = await window.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) throw error;

        document.getElementById('modalTitle').textContent = 'Editar Evento';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date.slice(0, 16);
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventLocation').value = event.location || '';

        eventModal.show();
    } catch (error) {
        console.error('Error al cargar evento:', error);
        showAlert('Error al cargar evento', 'danger');
    }
}

// Guardar evento
async function saveEvent() {
    const eventId = document.getElementById('eventId').value;
    
    // Obtener la fecha y hora del input tal cual
    const dateInput = document.getElementById('eventDate').value;
    
    // Validar que el input no esté vacío
    if (!dateInput) {
        showAlert('Por favor, selecciona una fecha y hora para el evento.', 'danger');
        return;
    }

    // Asegurarse de que el formato sea completo (YYYY-MM-DDTHH:mm:ss)
    let eventDateToSave = dateInput;
    if (dateInput.length === 16) {
        eventDateToSave += ':00';
    }

    const eventData = {
        title: document.getElementById('eventTitle').value,
        date: eventDateToSave,
        description: document.getElementById('eventDescription').value,
        location: document.getElementById('eventLocation').value,
        user_id: currentUser.id
    };

    try {
        // Subir imagen si se seleccionó una
        const imageFile = document.getElementById('eventImage').files[0];
        if (imageFile) {
            const filePath = `${Date.now()}-${imageFile.name}`;
            const { data: imageData, error: imageError } = await window.supabase.storage
                .from('event-images')
                .upload(filePath, imageFile);

            if (imageError) throw imageError;

            const { data: { publicUrl } } = window.supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);

            eventData.image_url = publicUrl;
        }

        let error;
        if (eventId) {
            // Actualizar evento existente
            const { error: updateError } = await window.supabase
                .from('events')
                .update(eventData)
                .eq('id', eventId);
            error = updateError;
        } else {
            // Crear nuevo evento
            const { error: insertError } = await window.supabase
                .from('events')
                .insert([eventData]);
            error = insertError;
        }

        if (error) throw error;

        eventModal.hide();
        await loadUserEvents();
    } catch (error) {
        console.error('Error al guardar evento:', error);
        showAlert('Error al guardar evento: ' + (error.message || 'Error desconocido'), 'danger');
    }
}

// Eliminar evento
async function deleteEvent(eventId) {
    eventToDelete = eventId;
    deleteEventModal.show();
}

// Confirmar eliminación
async function confirmDelete() {
    if (!eventToDelete) return;

    try {
        const { error } = await window.supabase
            .from('events')
            .delete()
            .eq('id', eventToDelete);

        if (error) throw error;

        deleteEventModal.hide();
        await loadUserEvents();
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        showAlert('Error al eliminar evento: ' + (error.message || 'Error desconocido'), 'danger');
    } finally {
        eventToDelete = null;
    }
}

// Ver detalles del evento
function viewEventDetails(eventId) {
    window.location.href = `eventos.html?id=${eventId}`;
}

// Cerrar sesión
async function handleLogout() {
    try {
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showAlert('Error al cerrar sesión', 'danger');
    }
} 
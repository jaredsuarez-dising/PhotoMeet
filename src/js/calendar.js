import supabase from './supabaseClient.js';
import { checkAuthStatus } from './auth';
import './auth';

import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

// DOM Elements
const calendarEl = document.getElementById('calendar');

// Initialize Calendar
document.addEventListener('DOMContentLoaded', () => {
    if (!calendarEl) return;

    // Initialize FullCalendar
    const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
        },
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        },
        height: 'auto',
        aspectRatio: 1.8,
        eventClick: function(info) {
            viewEventDetails(info.event.id);
        },
        events: async function(fetchInfo, successCallback, failureCallback) {
            try {
                const events = await loadEvents(fetchInfo.start, fetchInfo.end);
                successCallback(events);
            } catch (error) {
                console.error('Error al cargar eventos:', error);
                failureCallback(error);
            }
        }
    });

    calendar.render();

    // View buttons
    document.getElementById('monthView').addEventListener('click', () => {
        calendar.changeView('dayGridMonth');
    });

    document.getElementById('weekView').addEventListener('click', () => {
        calendar.changeView('timeGridWeek');
    });

    document.getElementById('dayView').addEventListener('click', () => {
        calendar.changeView('timeGridDay');
    });

    checkAuthStatus(); // Asegúrate de que la autenticación se verifique
});

// Function to load events from Supabase
async function loadEvents(start, end) {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', start.toISOString())
            .lte('date', end.toISOString())
            .order('date', { ascending: true });

        if (error) throw error;

        return events.map(event => {
            // Usar directamente la URL de la base de datos
            return ({
                id: event.id,
                title: event.title,
                start: event.date,
                description: event.description,
                location: event.location,
                // Pasar la URL de la imagen directamente si existe
                 imageUrl: event.image_url
            });
        });
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        return [];
    }
}

// Function to load upcoming events
async function loadUpcomingEvents() {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true })
            .limit(5);

        if (error) throw error;

        const upcomingEventsEl = document.getElementById('upcomingEvents');
        if (upcomingEventsEl) {
            upcomingEventsEl.innerHTML = events.map(event => `
                <div class="upcoming-event mb-3">
                    <h6>${event.title}</h6>
                    <small class="text-muted">${formatDate(event.date)}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error al cargar eventos próximos:', error);
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

// Function to generate a color based on the user ID (simple hash)
function getUserColor(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// Function to view event details
async function viewEventDetails(eventId) {
    try {
        // Obtener comentarios y el nombre del usuario asociado
        const { data: event, error } = await supabase
            .from('events')
            .select('*, comments(*, users(name))') // Selecciona el nombre del usuario relacionado
            .eq('id', eventId)
            .single();

        if (error) throw error;

        // Asegurarse de que el modal existe y está inicializado (Bootstrap 5)
        const eventDetailsModalEl = document.getElementById('eventDetailsModal');
        if (!eventDetailsModalEl) {
            console.error('Modal de detalles del evento no encontrado.');
            return;
        }
        const modal = new bootstrap.Modal(eventDetailsModalEl);

        const modalBody = document.getElementById('eventDetails');
        
         // Usar directamente la URL de la base de datos
        modalBody.innerHTML = `
            <div class="event-details">
                ${event.image_url ? `
                    <img src="${event.image_url}" class="img-fluid rounded mb-3" alt="${event.title}">
                ` : ''}
                <h4>${event.title}</h4>
                <p><i class="bi bi-calendar"></i> ${new Date(event.date).toLocaleString()}</p>
                <p><i class="bi bi-geo-alt"></i> ${event.location}</p>
                <p>${event.description}</p>
                
                <div class="comments-section mt-4">
                    <h5>Comentarios</h5>
                    <div id="commentsList" class="mb-3">
                        ${event.comments ? event.comments.map(comment => `
                            <div class="comment mb-2" style="border-left: 4px solid ${getUserColor(comment.user_id)}; padding-left: 10px;">
                                <strong>${comment.users ? comment.users.name : 'Usuario Desconocido'}:</strong> <!-- Muestra el nombre del usuario -->
                                <p class="mb-1">${comment.comment}</p>
                            </div>
                        `).join('') : ''}
                    </div>
                    <form id="commentForm" onsubmit="addComment(event, '${eventId}')">
                        <div class="mb-3">
                            <textarea class="form-control" id="commentContent" rows="2" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Agregar Comentario</button>
                    </form>
                </div>
            </div>
        `;
        
        modal.show();
    } catch (error) {
        console.error('Error al cargar detalles del evento:', error);
        alert('Error al cargar los detalles del evento');
    }
}

// Function to add a comment (reutilizada del archivo eventos.html)
async function addComment(event, eventId) {
    event.preventDefault();
    
    const content = document.getElementById('commentContent').value;
    const { data: sessionData } = await window.supabase.auth.getSession();
    const user = sessionData.session?.user;
    
    if (!user) {
        alert('Debes iniciar sesión para comentar');
        return;
    }

    try {
        const { error } = await window.supabase
            .from('comments')
            .insert([{
                event_id: eventId,
                user_id: user.id,
                comment: content
            }]);

        if (error) throw error;

        document.getElementById('commentContent').value = '';
        viewEventDetails(eventId);
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        alert('Error al agregar el comentario');
    }
}

// AOS Initialization (if used on this page)
// AOS.init();

// Load upcoming events when the page loads (Keep if needed on this page)
document.addEventListener('DOMContentLoaded', loadUpcomingEvents); 
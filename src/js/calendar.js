import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize FullCalendar
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'es',
        events: loadEvents,
        eventClick: handleEventClick
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
});

// Load events from Supabase
async function loadEvents(info, successCallback, failureCallback) {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*, users(name)')
            .gte('date', info.startStr)
            .lte('date', info.endStr);

        if (error) throw error;

        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.date,
            description: event.description,
            location: event.location,
            image_url: event.image_url
        }));

        successCallback(formattedEvents);
    } catch (error) {
        console.error('Error loading events:', error);
        failureCallback(error);
    }
}

// Handle event click
function handleEventClick(info) {
    const event = info.event;
    const modal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
    
    document.getElementById('eventDetails').innerHTML = `
        <div class="text-center mb-4">
            <img src="${event.extendedProps.image_url}" class="img-fluid rounded" alt="${event.title}">
        </div>
        <h4>${event.title}</h4>
        <p class="text-muted">
            <i class="fas fa-calendar"></i> ${formatDate(event.start)}
            <br>
            <i class="fas fa-map-marker-alt"></i> ${event.extendedProps.location}
        </p>
        <p>${event.extendedProps.description}</p>
    `;

    modal.show();
}

// Load upcoming events
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
        upcomingEventsEl.innerHTML = events.map(event => `
            <div class="upcoming-event mb-3">
                <h6>${event.title}</h6>
                <small class="text-muted">${formatDate(event.date)}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading upcoming events:', error);
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

// Load upcoming events when the page loads
document.addEventListener('DOMContentLoaded', loadUpcomingEvents); 
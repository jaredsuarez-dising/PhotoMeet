import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const calendarEl = document.getElementById('calendar');
// Assuming you have a modal or section to display event details
const eventDetailsModal = document.getElementById('eventDetailsModal'); // Example modal ID

// Auth DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const userMenu = document.getElementById('userMenu');

// Initialize Calendar and check auth status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Hide auth elements initially to prevent flicker
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'none';

    // Initialize FullCalendar
    const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        eventClick: function(info) {
            handleEventClick(info.event);
        },
        events: async function(fetchInfo, successCallback, failureCallback) {
            try {
                const events = await loadEvents(fetchInfo.start, fetchInfo.end);
                successCallback(events);
            } catch (error) {
                failureCallback(error);
            }
        }
    });
    calendar.render();

    checkAuthStatus(); // Add this line

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

// Check authentication status
async function checkAuthStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        showUserMenu(user);
    } else {
        showAuthButtons();
    }
}

// Show user menu when logged in
function showUserMenu(user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    
    if (userMenu) {
        userMenu.style.display = 'block';
        userMenu.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    ${user.email}
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="logout()">Cerrar Sesión</a></li>
                </ul>
            </div>
        `;
    }
}

// Show auth buttons when logged out
function showAuthButtons() {
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
}

// Handle logout
window.logout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        checkAuthStatus();
        alert('Sesión cerrada correctamente');
    } catch (error) {
        alert('Error al cerrar sesión: ' + error.message);
    }
};

// Function to load events from Supabase for the calendar
async function loadEvents(start, end) {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*, users(name)')
            .gte('date', start)
            .lte('date', end);

        if (error) throw error;

        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.date,
            description: event.description,
            location: event.location,
            image_url: event.image_url
        }));

        return formattedEvents;
    } catch (error) {
        console.error('Error loading events:', error);
        return [];
    }
}

// Function to handle event click
function handleEventClick(event) {
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

// Function to load upcoming events (if used elsewhere on the page)
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

function getEventColor(eventType) {
    // ... existing code ...
}

// AOS Initialization (if used on this page)
// AOS.init();

// Load upcoming events when the page loads
document.addEventListener('DOMContentLoaded', loadUpcomingEvents); 
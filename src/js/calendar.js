import supabase from './supabaseClient';
import { checkAuthStatus } from './auth';
import './auth'; // Import auth.js to run the onAuthStateChange listener
import { viewEvent } from './eventDetailsModal'; // Import the viewEvent function

import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

// DOM Elements
const calendarEl = document.getElementById('calendar');
// Assuming you have a modal or section to display event details
const eventDetailsModal = document.getElementById('eventDetailsModal'); // Example modal ID

// Initialize Calendar and check auth status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Hide auth elements initially to prevent flicker (auth.js will handle showing based on status)
    // if (loginBtn) loginBtn.style.display = 'none'; // Handled by auth.js
    // if (registerBtn) registerBtn.style.display = 'none'; // Handled by auth.js
    // if (userMenu) userMenu.style.display = 'none'; // Handled by auth.js

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
            viewEvent(info.event.id); // Use the imported function
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

    checkAuthStatus(); // Use the centralized function

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

// Function to load events from Supabase for the calendar
async function loadEvents(start, end) {
    try {
        console.log('Cargando eventos para el rango:', start, 'a', end);
        
        // Convert Date objects to ISO 8601 strings for Supabase filters
        const startISO = start.toISOString();
        const endISO = end.toISOString();

        console.log('Rango de fechas en formato ISO:', startISO, 'a', endISO);

        const { data: events, error } = await supabase
            .from('events')
            .select('*, users(name)')
            .gte('date', startISO) // Use ISO string
            .lte('date', endISO);   // Use ISO string

        if (error) throw error;

        console.log('Eventos recuperados de Supabase:', events);

        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.date, // Supabase usually returns ISO string, which is fine for FullCalendar
            description: event.description,
            location: event.location,
            image_url: event.image_url
        }));

        console.log('Eventos formateados para FullCalendar:', formattedEvents);

        return formattedEvents;
    } catch (error) {
        console.error('Error loading events:', error);
        return [];
    }
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

// Load upcoming events when the page loads (Keep if needed on this page)
document.addEventListener('DOMContentLoaded', loadUpcomingEvents); 
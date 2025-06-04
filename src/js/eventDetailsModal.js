import supabase from './supabaseClient';
import { showLoading, hideLoading, showToast, debounceButton } from './utils';

// Make viewEvent function globally available
window.viewEvent = async function(eventId) {
    console.log('viewEvent called for event ID:', eventId);
    showLoading('Cargando detalles del evento...');

    try {
        // Get event details
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*, users(name)')
            .eq('id', eventId)
            .single();

        if (eventError) throw eventError;

        // Get comments for this event
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('*, users(name)')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;

        // Get the modal element
        const modalElement = document.getElementById('eventDetailsModal');
        if (!modalElement) {
            throw new Error('Modal element not found');
        }

        // Create a new Bootstrap modal instance
        const modal = new bootstrap.Modal(modalElement);

        // Update modal content
        const detailsElement = modalElement.querySelector('#eventDetails');
        if (!detailsElement) {
            throw new Error('Event details element not found');
        }

        // Format the date
        const eventDate = new Date(event.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update modal content with event details
        detailsElement.innerHTML = `
            <div class="event-header mb-4">
                ${event.image_url ? `<img src="${event.image_url}" class="img-fluid rounded mb-3" alt="${event.title}">` : ''}
                <h3>${event.title}</h3>
                <p class="text-muted">${eventDate}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
            </div>
            <div class="event-description mb-4">
                <h4>Descripción</h4>
                <p>${event.description}</p>
            </div>
            <div class="event-comments">
                <h4>Comentarios</h4>
                <div id="commentsList">
                    ${comments.map(comment => `
                        <div class="comment mb-3">
                            <strong>${comment.users.name}</strong>
                            <p>${comment.comment}</p>
                            <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                        </div>
                    `).join('')}
                </div>
                <form id="commentForm" class="mt-3">
                    <div class="mb-3">
                        <textarea class="form-control" rows="3" placeholder="Escribe un comentario..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" id="submitCommentBtn">Publicar Comentario</button>
                </form>
            </div>
        `;

        // Add comment form handler with debounce
        const commentForm = detailsElement.querySelector('#commentForm');
        const submitCommentBtn = detailsElement.querySelector('#submitCommentBtn');

        if (commentForm && submitCommentBtn) {
            debounceButton(submitCommentBtn, async (e) => {
                e.preventDefault();
                const commentTextarea = commentForm.querySelector('textarea');
                const comment = commentTextarea.value;

                if (!comment.trim()) {
                    showToast('El comentario no puede estar vacío.', 'error');
                    return;
                }

                showLoading('Publicando comentario...');
                try {
                    // Ensure user is authenticated before posting comment
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    if (userError || !user) {
                        showToast('Debes iniciar sesión para comentar.', 'error');
                        return;
                    }

                    const { error } = await supabase
                        .from('comments')
                        .insert([{
                            event_id: eventId,
                            user_id: user.id,
                            comment: comment
                        }]);

                    if (error) throw error;

                    showToast('Comentario publicado');
                    commentTextarea.value = ''; // Clear textarea
                    
                    // Reload only the comments section
                    await reloadCommentsSection(eventId, detailsElement);

                } catch (error) {
                    console.error('Error posting comment:', error);
                    showToast('Error al publicar el comentario: ' + error.message, 'error');
                } finally {
                    hideLoading();
                }
            });
        }

        modal.show();

    } catch (error) {
        console.error('Error loading event details:', error);
        showToast('Error al cargar los detalles del evento: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// Helper function to reload comments section
async function reloadCommentsSection(eventId, detailsElement) {
    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select('*, users(name)')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const commentsList = detailsElement.querySelector('#commentsList');
        if (commentsList) {
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment mb-3">
                    <strong>${comment.users.name}</strong>
                    <p>${comment.comment}</p>
                    <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error reloading comments:', error);
        showToast('Error al recargar comentarios: ' + error.message, 'error');
    }
} 
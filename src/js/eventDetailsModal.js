import supabase from './supabaseClient';
import { formatDate } from './utils';

// View event details - Logic for showing the modal and loading data
export async function viewEvent(eventId) {
    console.log('viewEvent called for event ID:', eventId);
    
    // --- Reverting commenting out complex logic ---
    try {
        // Select all details needed for the modal
        const { data: event, error } = await supabase
            .from('events')
            .select('*, users(name)') 
            .eq('id', eventId)
            .single();

        if (error) throw error;

        // Load comments - keeping as is for now, consider optimization if this is the bottleneck
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('*, users(name)')
            .eq('event_id', eventId)
            .order('id', { ascending: false });

        if (commentsError) throw commentsError;

        // Show event details in modal
        const modalElement = document.getElementById('eventDetailsModal');
        const detailsElement = document.getElementById('eventDetails'); // This was needed

        if (!modalElement || !detailsElement) { // Revert to original check
             console.error('Modal or details element not found!');
             alert('Error: Elementos del modal de detalles no encontrados.');
             return;
        }

        const modal = new bootstrap.Modal(modalElement);
        console.log('Bootstrap Modal instance created:', modal);
        
        const imageUrl = event.image_url ? 
            `https://yqtsrbtgfpbkrnrcwnnf.supabase.co/storage/v1/object/public/event-images/${event.image_url}` : 
            '[URL_IMAGEN_POR_DEFECTO]'; // Replace with a default image URL if needed

        detailsElement.innerHTML = `
            <div class="text-center mb-4">
                <img src="${imageUrl}" class="img-fluid rounded" alt="${event.title}" loading="lazy">
            </div>
            <h4>${event.title}</h4>
            <p class="text-muted">
                <i class="fas fa-calendar"></i> ${formatDate(event.date)}
                <br>
                <i class="fas fa-map-marker-alt"></i> ${event.location}
                <br>
            </p>
            <p>${event.description}</p>
            <hr>
            <h5>Comentarios</h5>
            <div class="comments-list">
                ${comments.map(comment => `
                    <div class="comment mb-3">
                        <strong>${comment.users ? comment.users.name : 'Usuario desconocido'}</strong>
                        <p>${comment.comment}</p>
                    </div>
                `).join('')}
            </div>
            <form id="commentForm" class="mt-3">
                <div class="mb-3">
                    <textarea class="form-control" placeholder="Escribe un comentario..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Comentar</button>
            </form>
        `;

        // Handle comment submission
        const commentForm = detailsElement.querySelector('#commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const commentTextarea = e.target.querySelector('textarea');
                const comment = commentTextarea.value;

                if (!comment.trim()) { // Simple validation
                    alert('El comentario no puede estar vacío.');
                    return;
                }

                try {
                    // Ensure user is authenticated before posting comment
                     const { data: { user }, error: userError } = await supabase.auth.getUser();
                     if (userError || !user) {
                         alert('Debes iniciar sesión para comentar.');
                         return;
                     }

                    const { error } = await supabase
                        .from('comments')
                        .insert([{
                            event_id: eventId,
                            user_id: user.id, // Use the obtained user ID
                            comment: comment
                        }]);

                    if (error) throw error;

                    alert('Comentario publicado');
                    commentTextarea.value = ''; // Clear textarea
                    
                    // Reload only the comments section instead of calling viewEvent again
                    await reloadCommentsSection(eventId, detailsElement); 

                } catch (error) {
                    console.error('Error posting comment:', error);
                    alert('Error al publicar el comentario: ' + error.message);
                }
            });
        }

        modal.show(); // Attempt to show the modal

    } catch (error) { // Reverting catch block
        console.error('Error loading event details:', error);
        alert('Error al cargar los detalles del evento: ' + error.message);
    }
};

// Helper function to reload comments section - Uncommenting
async function reloadCommentsSection(eventId, detailsElement) {
    try {
        // Load comments again
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('*, users(name)')
            .eq('event_id', eventId)
            .order('id', { ascending: false });

        if (commentsError) throw commentsError;

        // Update only the comments list
        const commentsListElement = detailsElement.querySelector('.comments-list');
        
        if (commentsListElement) {
             commentsListElement.innerHTML = comments.map(comment => `
                 <div class="comment mb-3">
                     <strong>${comment.users ? comment.users.name : 'Usuario desconocido'}</strong>
                     <p>${comment.comment}</p>
                 </div>
             `).join('');
        }

         // No need to re-attach form listener if we only update .comments-list innerHTML

    } catch (error) {
        console.error('Error reloading comments section:', error);
        alert('Error al recargar los comentarios: ' + error.message);
    }
}

// Make viewEvent globally accessible for onclick attributes in HTML
window.viewEvent = viewEvent; 
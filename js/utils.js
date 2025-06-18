// Helper function to format dates
export function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Loading spinner functions
export function showLoading(message = 'Cargando...') {
    const spinnerHTML = `
        <div class="spinner-overlay">
            <div class="spinner-container">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', spinnerHTML);
}

export function hideLoading() {
    const spinner = document.querySelector('.spinner-overlay');
    if (spinner) {
        spinner.remove();
    }
}

// Toast notification functions
export function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toastHTML = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">${type === 'success' ? 'Éxito' : 'Error'}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
    
    // Remove the toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Button debounce function to prevent spam
export function debounceButton(button, callback, delay = 1000) {
    let isProcessing = false;
    
    button.addEventListener('click', async (e) => {
        if (isProcessing) return;
        
        isProcessing = true;
        button.disabled = true;
        
        try {
            await callback(e);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setTimeout(() => {
                isProcessing = false;
                button.disabled = false;
            }, delay);
        }
    });
}

// Function to show alerts (assuming elements exist)
export function showAlert(message, type) {
    const alertElement = document.getElementById(`${formId}${type}`);
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }
} 
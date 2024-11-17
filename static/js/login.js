document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();
    const caretakerNameInput = document.getElementById('caretakerName');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!caretakerNameInput) {
        console.error('Caretaker name input not found');
        return;
    }
    
    const caretakerName = caretakerNameInput.value.trim();
    
    try {
        // Fetch caretakers from the server
        const response = await fetch('/caretakers');
        if (!response.ok) {
            throw new Error('Failed to fetch caretakers');
        }
        
        const caretakers = await response.json();
        const caretaker = caretakers.find(c => c.name.toLowerCase() === caretakerName.toLowerCase());
        
        if (caretaker) {
            // Store both the caretaker ID and name in session storage
            sessionStorage.setItem('caretakerId', caretaker.caretaker_id);
            sessionStorage.setItem('caretakerName', caretaker.name);
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            showError('Caretaker not found. Please try again.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showError('An error occurred during login. Please try again.');
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}
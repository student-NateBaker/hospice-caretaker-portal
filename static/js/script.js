let caretakerId = null;
let currentPatientId = null;
let caretakers = [];

// Initialize all event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Caretaker select handler
    const caretakerSelect = document.getElementById('caretakerSelect');
    if (caretakerSelect) {
        caretakerSelect.addEventListener('change', handleCaretakerAssignment);
    }

    // Load dashboard data if on dashboard page
    if (window.location.pathname === '/dashboard') {
        loadDashboardData();
    }
});

async function handleLogin(event) {
    event.preventDefault();
    const caretakerNameInput = document.getElementById('caretakerName');
    
    if (!caretakerNameInput) {
        console.error('Caretaker name input not found');
        return;
    }

    const caretakerName = caretakerNameInput.value;

    try {
        const response = await fetch('/caretakers');
        const caretakers = await response.json();
        const caretaker = caretakers.find(c => c.name.toLowerCase() === caretakerName.toLowerCase());

        if (caretaker) {
            caretakerId = caretaker.caretaker_id;
            sessionStorage.setItem('caretakerId', caretakerId);
            window.location.href = '/dashboard';
        } else {
            alert('Caretaker not found');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Error during login. Please try again.');
    }
}

async function loadDashboardData() {
    try {
        // Fetch all caretakers first
        const caretakersResponse = await fetch('/caretakers');
        caretakers = await caretakersResponse.json();
        
        // Fetch all patients
        const patientsResponse = await fetch('/patients');
        const patients = await patientsResponse.json();
        
        // Display patients
        displayPatients(patients);
        
        // Populate caretaker dropdown
        populateCaretakerDropdown();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Error loading dashboard data');
    }
}

function displayPatients(patients) {
    const patientsList = document.getElementById('patientsList');
    if (!patientsList) {
        console.error('Patients list element not found');
        return;
    }

    patientsList.innerHTML = ''; // Clear existing list

    patients.forEach(patient => {
        const patientCard = document.createElement('div');
        patientCard.className = 'patient-card';
        
        // Find current caretaker name
        const caretaker = caretakers.find(c => c.caretaker_id === patient.caretaker_id);
        const caretakerName = caretaker ? caretaker.name : 'No caretaker assigned';

        patientCard.innerHTML = `
            <h3>${patient.first_name} ${patient.last_name}</h3>
            <p><strong>Current Caretaker:</strong> ${caretakerName}</p>
        `;
        
        patientCard.onclick = () => showPatientDetails(patient);
        patientsList.appendChild(patientCard);
    });
}

function populateCaretakerDropdown() {
    const select = document.getElementById('caretakerSelect');
    if (!select) {
        console.error('Caretaker select element not found');
        return;
    }

    select.innerHTML = '<option value="">Select Caretaker</option>';
    caretakers.forEach(caretaker => {
        const option = document.createElement('option');
        option.value = caretaker.caretaker_id;
        option.textContent = caretaker.name;
        select.appendChild(option);
    });
}

function showPatientDetails(patient) {
    currentPatientId = patient.patient_id;
    
    const elements = {
        name: document.getElementById('patientName'),
        dob: document.getElementById('patientDOB'),
        gender: document.getElementById('patientGender'),
        phone: document.getElementById('patientPhone'),
        conditions: document.getElementById('patientConditions'),
        notes: document.getElementById('patientNotes'),
        details: document.getElementById('patientDetails'),
        caretakerSelect: document.getElementById('caretakerSelect')
    };

    // Check if all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Patient ${key} element not found`);
            return;
        }
    }
    
    elements.name.textContent = `${patient.first_name} ${patient.last_name}`;
    elements.dob.textContent = patient.date_of_birth;
    elements.gender.textContent = patient.gender;
    elements.phone.textContent = patient.phone;
    elements.conditions.textContent = patient.conditions || 'None';
    elements.notes.textContent = patient.notes || 'None';
    
    // Set current caretaker in dropdown
    elements.caretakerSelect.value = patient.caretaker_id || '';
    elements.details.classList.remove('hidden');
}

async function handleCaretakerAssignment(event) {
    if (!currentPatientId) {
        console.error('No patient selected');
        return;
    }
    
    const newCaretakerId = event.target.value;
    try {
        const response = await fetch(`/patients/${currentPatientId}/assign_caretaker/${newCaretakerId}`, {
            method: 'PATCH'
        });
        
        if (!response.ok) throw new Error('Failed to assign caretaker');
        
        // Refresh the patients list to show the update
        const patientsResponse = await fetch('/patients');
        const patients = await patientsResponse.json();
        displayPatients(patients);
        
        alert('Caretaker assigned successfully');
    } catch (error) {
        console.error('Error assigning caretaker:', error);
        alert('Error assigning caretaker');
    }
}
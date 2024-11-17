let caretakerId = null;
let currentPatientId = null;
let caretakers = [];

document.addEventListener('DOMContentLoaded', () => {
    // Get the caretaker's name and ID from session storage
    const caretakerName = sessionStorage.getItem('caretakerName');
    caretakerId = sessionStorage.getItem('caretakerId');

    // Update the welcome message with the caretaker's name
    const caretakerNameElement = document.getElementById('caretakerName');
    if (caretakerNameElement && caretakerName) {
        caretakerNameElement.textContent = caretakerName;
    }

    // Add event listener to caretaker dropdown
    const caretakerSelect = document.getElementById('caretakerSelect');
    if (caretakerSelect) {
        caretakerSelect.addEventListener('change', handleCaretakerAssignment);
    }

    // Ensure the dashboard is loaded with the caretaker's data
    if (caretakerId) {
        loadDashboardData();
    } else {
        alert('No caretaker found. Please log in again.');
        window.location.href = '/';
    }
});

async function loadDashboardData() {
    try {
        // Fetch caretakers first
        const caretakersResponse = await fetch('/caretakers');
        if (!caretakersResponse.ok) {
            throw new Error('Failed to fetch caretakers');
        }
        caretakers = await caretakersResponse.json();
        
        // Populate the caretaker dropdown
        populateCaretakerDropdown();

        // Then fetch and display patients data
        const patientsResponse = await fetch('/patients');
        const patients = await patientsResponse.json();
        displayPatients(patients);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function displayPatients(patients) {
    const patientsList = document.getElementById('patientsList');
    patientsList.innerHTML = '';

    patients.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card';

        const caretaker = caretakers.find(c => c.caretaker_id === patient.caretaker_id);
        const caretakerName = caretaker ? caretaker.name : 'No caretaker assigned';

        card.innerHTML = `
            <h3>${patient.first_name} ${patient.last_name}</h3>
            <p><strong>Caretaker:</strong> ${caretakerName}</p>
        `;

        card.onclick = () => showPatientDetails(patient);
        patientsList.appendChild(card);
    });
}

function showPatientDetails(patient) {
    currentPatientId = patient.patient_id;

    document.getElementById('patientName').textContent = `${patient.first_name} ${patient.last_name}`;
    document.getElementById('patientDOB').textContent = patient.date_of_birth;
    document.getElementById('patientGender').textContent = patient.gender;
    document.getElementById('patientPhone').textContent = patient.phone;
    document.getElementById('patientConditions').textContent = patient.conditions || 'None';
    document.getElementById('patientNotes').textContent = patient.notes || 'None';

    const caretakerSelect = document.getElementById('caretakerSelect');
    caretakerSelect.value = patient.caretaker_id || '';

    document.getElementById('patientDetails').classList.remove('hidden');
}

function populateCaretakerDropdown() {
    const caretakerSelect = document.getElementById('caretakerSelect');
    if (!caretakerSelect) return;
    
    caretakerSelect.innerHTML = '<option value="">Select Caretaker</option>';
    
    caretakers.forEach(caretaker => {
        const option = document.createElement('option');
        option.value = caretaker.caretaker_id;
        option.textContent = caretaker.name;
        caretakerSelect.appendChild(option);
    });
}

async function handleCaretakerAssignment(event) {
    const newCaretakerId = event.target.value;

    if (!currentPatientId) {
        console.error('No patient selected');
        return;
    }

    try {
        const response = await fetch(`/patients/${currentPatientId}/assign_caretaker/${newCaretakerId}`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error('Failed to assign caretaker');
        }

        // Fetch the updated patient data
        const updatedPatientResponse = await fetch(`/patients/${currentPatientId}`);
        const updatedPatient = await updatedPatientResponse.json();

        // Update the current patient details displayed
        updatePatientDetails(updatedPatient);

        // Refresh the patients list to show the new caretaker
        const patientsResponse = await fetch('/patients');
        const patients = await patientsResponse.json();
        displayPatients(patients);

        alert('Caretaker assigned successfully');
    } catch (error) {
        console.error('Error assigning caretaker:', error);
        alert('Error assigning caretaker');
    }
}

function updatePatientDetails(patient) {
    document.getElementById('patientName').textContent = `${patient.first_name} ${patient.last_name}`;
    document.getElementById('patientDOB').textContent = patient.date_of_birth;
    document.getElementById('patientGender').textContent = patient.gender;
    document.getElementById('patientPhone').textContent = patient.phone;
    document.getElementById('patientConditions').textContent = patient.conditions || 'None';
    document.getElementById('patientNotes').textContent = patient.notes || 'None';

    // Update the caretaker dropdown value
    const caretakerSelect = document.getElementById('caretakerSelect');
    caretakerSelect.value = patient.caretaker_id || '';
}
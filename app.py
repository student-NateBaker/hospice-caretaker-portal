from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask import render_template
from datetime import datetime

app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hospital.db'  # SQLite database file
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define the Patients model (table)
class Patient(db.Model):
    __tablename__ = 'patients'
    patient_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    caretaker_id = db.Column(db.Integer, db.ForeignKey('caretakers.caretaker_id'), nullable=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    conditions = db.Column(db.Text, nullable=True) 
    notes = db.Column(db.Text, nullable=True) 
    

    def to_dict(self):
        return {
            "patient_id": self.patient_id,
            "caretaker_id": self.caretaker_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "date_of_birth": self.date_of_birth.isoformat(),
            "gender": self.gender,
            "phone": self.phone,
            "conditions": self.conditions,
            "notes": self.notes
        }


class Caretaker(db.Model):
    __tablename__ = 'caretakers'
    caretaker_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)

    # Relationship to patients
    patients = db.relationship('Patient', backref='caretaker', lazy=True)

    def to_dict(self):
        return {
            "caretaker_id": self.caretaker_id,
            "name": self.name,
            "patients": [patient.patient_id for patient in self.patients]  # List of patient IDs
        }
# Initialize the database
with app.app_context():
    db.create_all()

# Routes

# Home route
@app.route("/")
def home():
    return render_template('test.html')

# Create a new patient
@app.route("/patients", methods=["POST"])
def add_patient():
    try:
        data = request.json
        # Convert the date string to a Python date object
        date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        
        new_patient = Patient(
            first_name=data['first_name'],
            last_name=data['last_name'],
            date_of_birth=date_of_birth,
            gender=data['gender'],
            phone=data['phone'],
            conditions=data.get('conditions', ''),  
            notes=data.get('notes', '')
        )
        db.session.add(new_patient)
        db.session.commit()
        return jsonify({"message": "Patient added successfully", "patient": new_patient.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# Get all patients
@app.route("/patients", methods=["GET"])
def get_patients():
    patients = Patient.query.all()
    return jsonify([patient.to_dict() for patient in patients])

# Get a patient by ID
@app.route("/patients/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if patient:
        return jsonify(patient.to_dict())
    return jsonify({"error": "Patient not found"}), 404

# Delete a patient by ID
@app.route("/patients/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if patient:
        db.session.delete(patient)
        db.session.commit()
        return jsonify({"message": "Patient deleted successfully"})
    return jsonify({"error": "Patient not found"}), 404

# Add a caretaker by ID
@app.route("/caretakers", methods=["POST"])
def add_caretaker():
    data = request.json
    new_caretaker = Caretaker(name=data['name'])
    db.session.add(new_caretaker)
    db.session.commit()
    return jsonify({"message": "Caretaker added successfully", "caretaker": new_caretaker.to_dict()}), 201

#Get all caretakers
@app.route("/caretakers", methods=["GET"])
def get_caretakers():
    caretakers = Caretaker.query.all()
    return jsonify([caretaker.to_dict() for caretaker in caretakers])

#Assign a Patient to a Caretaker
@app.route("/patients/<int:patient_id>/assign_caretaker/<int:caretaker_id>", methods=["PATCH"])
def assign_caretaker(patient_id, caretaker_id):
    patient = Patient.query.get(patient_id)
    caretaker = Caretaker.query.get(caretaker_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    if not caretaker:
        return jsonify({"error": "Caretaker not found"}), 404

    patient.caretaker_id = caretaker_id
    db.session.commit()
    return jsonify({"message": "Caretaker assigned successfully", "patient": patient.to_dict()})

# Run the server
if __name__ == "__main__":
    app.run(debug=True)

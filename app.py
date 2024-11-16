from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hospital.db'  # SQLite database file
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define the Patients model (table)
class Patient(db.Model):
    __tablename__ = 'patients'
    patient_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    caretaker_id = db.Column(db.Integer)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    

    def to_dict(self):
        return {
            "patient_id": self.patient_id,
            "caretaker_id": self.caretaker_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "date_of_birth": self.date_of_birth.isoformat(),
            "gender": self.gender,
            "phone": self.phone,
        }
class Caretaker(db.Model):
    __tablename__ = 'caretakers'
    caretaker_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            "caretaker_id": self.caretaker_id,
            "name": self.name
        }
# Initialize the database
@app.before_first_request
def create_tables():
    db.create_all()

# Routes

# Home route
@app.route("/")
def home():
    return "Welcome to the Patients Management API!"

# Create a new patient
@app.route("/patients", methods=["POST"])
def add_patient():
    data = request.json
    new_patient = Patient(
        first_name=data['first_name'],
        last_name=data['last_name'],
        date_of_birth=data['date_of_birth'],
        gender=data['gender'],
        phone=data['phone'],
        email=data['email'],
        emergency_contact=data.get('emergency_contact'),
        emergency_phone=data.get('emergency_phone')
    )
    db.session.add(new_patient)
    db.session.commit()
    return jsonify({"message": "Patient added successfully", "patient": new_patient.to_dict()}), 201

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

# Run the server
if __name__ == "__main__":
    app.run(debug=True)

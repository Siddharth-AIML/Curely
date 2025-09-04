import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Briefcase, Banknote, MapPin, X, Loader2 } from 'lucide-react';
import DashboardLayout from '/src/components/DashboardLayout.jsx';
import { getAllDoctors, getCustomerProfile, requestAppointment } from '/src/services/api.js';

// Main Appointments Component
export default function CustomerAppointments() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentData, setAppointmentData] = useState({
    appointment_date: '',
    appointment_time: '',
    reason: '',
    priority: 'normal',
    type: 'video', // Default appointment type
    patient_notes: ''
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [profileRes, doctorsRes] = await Promise.all([
          getCustomerProfile(),
          getAllDoctors()
        ]);
        setUserProfile(profileRes.data);
        setDoctors(doctorsRes.data);
      } catch (error) {
        setMessage('An error occurred while fetching data.');
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingForm(true);
    setMessage('');
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...appointmentData,
        doctorId: selectedDoctor._id,
        reason: appointmentData.patient_notes // The model uses 'reason'
      };
      
      await requestAppointment(payload);

      setMessage('Appointment requested successfully!');
      setShowBookingForm(false);
      setAppointmentData({ date: '', time: '', reason: '', priority: 'normal', type: 'video', patient_notes: '' });
      setSelectedDoctor(null);

    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Failed to book appointment';
      setMessage(errorMsg);
      console.error("Booking error:", error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData(prev => ({...prev, [name]: value}));
  };

  const closeBookingForm = () => {
    setShowBookingForm(false);
    setSelectedDoctor(null);
  };

  return (
    <DashboardLayout activeItem="appointments" userProfile={userProfile}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Book an Appointment</h1>
        <p className="text-slate-500 mt-1">Choose from our network of qualified healthcare providers.</p>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-lg text-sm ${message.includes('successfully') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-emerald-600" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} onBook={() => handleBookAppointment(doctor)} />
          ))}
        </div>
      )}

      {showBookingForm && selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          appointmentData={appointmentData}
          onClose={closeBookingForm}
          onSubmit={handleSubmitAppointment}
          onInputChange={handleInputChange}
        />
      )}
    </DashboardLayout>
  );
}

// Helper Components (can be moved to their own files if desired)
const DoctorCard = ({ doctor, onBook }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col">
    <div className="flex items-center gap-4 mb-4">
      <img
        src={`https://api.dicebear.com/7.x/initials/svg?seed=${doctor.name}`}
        alt={doctor.name}
        className="w-16 h-16 rounded-full bg-slate-100 border-2 border-emerald-200"
      />
      <div>
        <h3 className="font-bold text-lg text-slate-900">Dr. {doctor.name}</h3>
        <p className="text-sm text-emerald-700 font-medium">{doctor.specialization}</p>
      </div>
    </div>
    <div className="space-y-3 text-sm flex-grow">
      <InfoItem icon={<Briefcase size={16} />} label="Experience" value={`${doctor.experience} years`} />
      <InfoItem icon={<Banknote size={16} />} label="Fee" value={`₹${doctor.fee}`} />
      <InfoItem icon={<Stethoscope size={16} />} label="Clinic" value={doctor.clinic_name} />
      <InfoItem icon={<MapPin size={16} />} label="Location" value={doctor.city} />
    </div>
    <button onClick={onBook} className="mt-6 w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all">
      Book Appointment
    </button>
  </div>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center text-slate-600">
    <span className="text-slate-400">{icon}</span>
    <span className="ml-2.5 font-medium">{label}:</span>
    <span className="ml-auto font-semibold text-slate-700">{value}</span>
  </div>
);

const BookingModal = ({ doctor, appointmentData, onClose, onSubmit, onInputChange }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <X size={24} />
      </button>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Appointment with Dr. {doctor.name}</h2>
      <p className="text-sm text-slate-500 mb-6">Please fill in the details below to request an appointment.</p>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Preferred Date" type="date" name="appointment_date" value={appointmentData.appointment_date} onChange={onInputChange} min={new Date().toISOString().split('T')[0]} required />
          <SelectField label="Preferred Time" name="appointment_time" value={appointmentData.appointment_time} onChange={onInputChange} required>
            <option value="">Select Time</option>
            <option value="09:00 AM">09:00 AM</option>
            <option value="10:00 AM">10:00 AM</option>
            <option value="11:00 AM">11:00 AM</option>
            <option value="02:00 PM">02:00 PM</option>
            <option value="04:00 PM">04:00 PM</option>
          </SelectField>
        </div>
         <SelectField label="Appointment Type" name="type" value={appointmentData.type} onChange={onInputChange}>
          <option value="video">Video Call</option>
          <option value="clinic">Clinic Visit</option>
          <option value="phone">Phone Call</option>
        </SelectField>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit (Notes)</label>
          <textarea name="patient_notes" value={appointmentData.patient_notes} onChange={onInputChange} rows="3" className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none" required />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200">Cancel</button>
          <button type="submit" className="py-2 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Request Appointment</button>
        </div>
      </form>
    </div>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input {...props} className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none" />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select {...props} className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none">
      {children}
    </select>
  </div>
);


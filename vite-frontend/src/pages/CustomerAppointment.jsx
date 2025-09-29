import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Briefcase, Banknote, MapPin, X, Loader2, Calendar, Clock, User, AlertTriangle, Filter } from 'lucide-react';
import DashboardLayout from '/src/components/DashboardLayout.jsx';
import { getAllDoctors, getCustomerProfile, requestAppointment, getCustomerAppointments } from '/src/services/api.js';
import { format } from 'date-fns';

// Main Component
export default function CustomerAppointments() {
  const [activeTab, setActiveTab] = useState('book');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ name: '', city: '', maxFee: '' });
  const navigate = useNavigate();

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [profileRes, doctorsRes, appointmentsRes] = await Promise.all([
        getCustomerProfile(),
        getAllDoctors(),
        getCustomerAppointments(),
      ]);
      setUserProfile(profileRes.data);
      setDoctors(doctorsRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      setMessage('An error occurred while fetching data.');
       if (error.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [navigate]);
  
  const uniqueCities = useMemo(() => {
      const cities = doctors.map(d => d.city);
      return [...new Set(cities)].sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
        const nameMatch = filters.name ? doctor.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
        const cityMatch = filters.city ? doctor.city.toLowerCase() === filters.city.toLowerCase() : true;
        const feeMatch = filters.maxFee ? doctor.fee <= parseInt(filters.maxFee, 10) : true;
        return nameMatch && cityMatch && feeMatch;
    });
  }, [doctors, filters]);


  return (
    <DashboardLayout activeItem="appointments" userProfile={userProfile}>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-500 mt-1">Book a new appointment or view your existing ones.</p>
        </div>
        <div className="bg-slate-200 p-1 rounded-lg flex items-center gap-1">
          <TabButton active={activeTab === 'book'} onClick={() => setActiveTab('book')}>Book an Appointment</TabButton>
          <TabButton active={activeTab === 'my'} onClick={() => setActiveTab('my')}>My Appointments</TabButton>
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-lg text-sm ${message.includes('successfully') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>
      ) : (
        <div>
          {activeTab === 'book' && (
            <div className="space-y-6">
                <FilterBar cities={uniqueCities} filters={filters} setFilters={setFilters} />
                <DoctorList doctors={filteredDoctors} onBookSelect={setSelectedDoctor} hasActiveFilters={filters.name || filters.city || filters.maxFee} />
            </div>
          )}
          {activeTab === 'my' && <MyAppointmentList appointments={appointments} />}
        </div>
      )}

      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onSuccess={() => {
            fetchInitialData();
            setSelectedDoctor(null);
            setActiveTab('my');
            setMessage('Appointment requested successfully! You can view its status under "My Appointments".');
          }}
          setMessage={setMessage}
        />
      )}
    </DashboardLayout>
  );
}

// Sub-components
const FilterBar = ({ cities, filters, setFilters }) => {
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center gap-4">
            <Filter size={20} className="text-slate-500" />
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search Doctor Name..." />
                <SelectField name="city" value={filters.city} onChange={handleFilterChange}>
                    <option value="">All Cities</option>
                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </SelectField>
                <InputField type="number" name="maxFee" value={filters.maxFee} onChange={handleFilterChange} placeholder="Max Fee (e.g., 1000)" />
            </div>
        </div>
    );
};

const DoctorList = ({ doctors, onBookSelect, hasActiveFilters }) => {
    if (doctors.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-50 rounded-lg">
                <Stethoscope size={40} className="mx-auto text-slate-400" />
                <h3 className="mt-4 text-lg font-semibold text-slate-700">
                    {hasActiveFilters ? "No Doctors Match Your Filters" : "No Verified Doctors Available"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    {hasActiveFilters ? "Try adjusting your search criteria." : "Please check back later."}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} onBook={() => onBookSelect(doctor)} />
            ))}
        </div>
    );
};

const MyAppointmentList = ({ appointments }) => {
  const upcoming = useMemo(() => appointments.filter(a => new Date(a.appointment_date) >= new Date() && (a.status === 'confirmed' || a.status === 'requested')), [appointments]);
  const past = useMemo(() => appointments.filter(a => new Date(a.appointment_date) < new Date() || ['completed', 'declined', 'cancelled'].includes(a.status)), [appointments]);

  if (appointments.length === 0) {
    return (
        <div className="text-center py-16 bg-slate-50 rounded-lg">
            <Calendar size={40} className="mx-auto text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-700">No Appointments Found</h3>
            <p className="mt-1 text-sm text-slate-500">You haven't booked any appointments yet.</p>
        </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Upcoming & Pending</h2>
        <div className="space-y-4">
          {upcoming.length > 0 ? upcoming.map(app => <AppointmentInfoCard key={app._id} appointment={app} />) : <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-md">No upcoming appointments.</p>}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Past Appointments</h2>
        <div className="space-y-4">
          {past.length > 0 ? past.map(app => <AppointmentInfoCard key={app._id} appointment={app} />) : <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-md">No past appointments.</p>}
        </div>
      </div>
    </div>
  );
};

const BookingModal = ({ doctor, onClose, onSuccess, setMessage }) => {
    const [data, setData] = useState({ appointment_date: '', appointment_time: '', reason: '', type: 'video', patient_notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        try {
            await requestAppointment({ ...data, doctorId: doctor._id, reason: data.patient_notes });
            onSuccess();
        } catch (error) {
            setMessage(error.response?.data?.msg || 'Failed to book appointment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Appointment with Dr. {doctor.name}</h2>
                <p className="text-sm text-slate-500 mb-6">Please fill in the details to request an appointment.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Preferred Date" type="date" name="appointment_date" value={data.appointment_date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
                        <SelectField label="Preferred Time" name="appointment_time" value={data.appointment_time} onChange={handleChange} required>
                            <option value="">Select Time</option>
                            <option value="09:00 AM">09:00 AM</option><option value="11:00 AM">11:00 AM</option><option value="02:00 PM">02:00 PM</option><option value="04:00 PM">04:00 PM</option>
                        </SelectField>
                    </div>
                    <SelectField label="Type" name="type" value={data.type} onChange={handleChange}>
                        <option value="video">Video Call</option><option value="clinic">Clinic Visit</option><option value="phone">Phone Call</option>
                    </SelectField>
                    <TextAreaField label="Reason for Visit" name="patient_notes" value={data.patient_notes} onChange={handleChange} required />
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center justify-center">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Request Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Reusable UI Components
const TabButton = ({ active, onClick, children }) => <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${active ? 'bg-white shadow' : 'text-slate-600 hover:bg-white/50'}`}>{children}</button>;
const DoctorCard = ({ doctor, onBook }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col">
    <div className="flex items-center gap-4 mb-4">
      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${doctor.name}`} alt={doctor.name} className="w-16 h-16 rounded-full bg-slate-100 border-2 border-emerald-200" />
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
    <button onClick={onBook} className="mt-6 w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all">Book Appointment</button>
  </div>
);

const AppointmentInfoCard = ({ appointment }) => {
    const statusStyles = { requested: 'bg-amber-100 text-amber-800', confirmed: 'bg-sky-100 text-sky-800', completed: 'bg-emerald-100 text-emerald-800', declined: 'bg-red-100 text-red-800', cancelled: 'bg-slate-100 text-slate-800' };
    return (
        <div className="bg-white p-4 rounded-xl border">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-slate-800">Dr. {appointment.doctorId?.name || 'N/A'}</p>
                    <p className="text-sm text-slate-500">{appointment.doctorId?.specialization}</p>
                </div>
                <div className={`text-xs font-bold capitalize py-1 px-3 rounded-full ${statusStyles[appointment.status]}`}>{appointment.status}</div>
            </div>
            <div className="mt-4 pt-4 border-t text-sm text-slate-600 space-y-2">
                <InfoItem icon={<Calendar size={16}/>} label="Date" value={format(new Date(appointment.appointment_date), 'MMMM d, yyyy')} />
                <InfoItem icon={<Clock size={16}/>} label="Time" value={appointment.appointment_time} />
                <InfoItem icon={<User size={16}/>} label="Reason" value={appointment.reason} />
            </div>
        </div>
    )
};

const InfoItem = ({ icon, label, value }) => (<div className="flex items-center"><span className="text-slate-400">{icon}</span><span className="ml-2.5 font-medium w-20">{label}:</span><span className="font-semibold text-slate-700">{value}</span></div>);
const InputField = (props) => (<input {...props} className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/50" />);
const SelectField = ({ children, ...props }) => (<select {...props} className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500/50">{children}</select>);
const TextAreaField = (props) => (<textarea {...props} rows="3" className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/50" />);


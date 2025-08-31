import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Briefcase, Banknote, MapPin, X, Loader2, LayoutDashboard, Calendar, FileText, MessageSquare, Settings, LogOut, HeartPulse } from 'lucide-react';



const SidebarItem = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center py-3 px-4 my-1 font-medium rounded-lg cursor-pointer
      transition-colors group w-full text-left
      ${active
        ? "bg-emerald-400/20 text-white"
        : "text-slate-300 hover:bg-white/10"
      }
    `}
  >
    {icon}
    <span className="ml-3">{text}</span>
  </button>
);

function Sidebar({ activeItem = 'dashboard', userProfile }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNavigation = (path) => {
    if (path) navigate(path);
  };

  return (
    <aside className="h-screen w-64 flex flex-col bg-gradient-to-br from-teal-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-xl text-white p-4 fixed left-0 top-0 border-r border-white/10">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
          <HeartPulse size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight">Curely</span>
      </div>

      <div className="bg-white/5 p-4 rounded-lg mb-6 text-center">
        <img
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name || 'User'}`}
          alt="Profile Avatar"
          className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-emerald-500/50"
        />
        <h4 className="font-semibold text-slate-100">{userProfile?.name || 'Loading...'}</h4>
        <p className="text-xs text-slate-400 truncate">{userProfile?.email}</p>
        {userProfile?.med_id && (
          <p className="mt-2 text-xs bg-teal-500/20 text-teal-200 rounded-full py-1 px-3 inline-block font-mono">
            Med ID: {userProfile.med_id}
          </p>
        )}
      </div>

      <nav className="flex-1">
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          text="Dashboard"
          active={activeItem === 'dashboard'}
          onClick={() => handleNavigation('/dashboard/customer')}
        />
        <SidebarItem
          icon={<Calendar size={20} />}
          text="Appointments"
          active={activeItem === 'appointments'}
          onClick={() => handleNavigation('/customer/appointments')}
        />
        <SidebarItem
          icon={<FileText size={20} />}
          text="Health Records"
          active={activeItem === 'records'}
          onClick={() => console.log("Navigate to records")}
        />
        <SidebarItem
          icon={<MessageSquare size={20} />}
          text="Messages"
          active={activeItem === 'messages'}
          onClick={() => console.log("Navigate to messages")}
        />
      </nav>

      <div>
        <SidebarItem
          icon={<Settings size={20} />}
          text="Settings"
          active={activeItem === 'settings'}
          onClick={() => console.log("Navigate to settings")}
        />
        <SidebarItem
          icon={<LogOut size={20} />}
          text="Logout"
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}

function DashboardLayout({ children, activeItem, userProfile }) {
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Sidebar activeItem={activeItem} userProfile={userProfile} />
      <div className="ml-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}


// ============================================================================
// 2. Main Appointments Component
// ============================================================================
export default function CustomerAppointments() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reason: '',
    priority: 'normal'
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
        const profileRes = await fetch("http://localhost:3001/api/customer/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          setUserProfile(await profileRes.json());
        }

        const doctorsRes = await fetch('http://localhost:3001/api/doctor/get-doctor', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (doctorsRes.ok) {
          setDoctors(await doctorsRes.json());
        } else {
          setMessage('Failed to fetch doctors');
        }
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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor._id,
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time,
          reason: appointmentData.reason,
          priority: appointmentData.priority
        })
      });

      if (response.ok) {
        setMessage('Appointment requested successfully!');
        setShowBookingForm(false);
        setAppointmentData({ date: '', time: '', reason: '', priority: 'normal' });
        setSelectedDoctor(null);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to book appointment');
      }
    } catch (error) {
      setMessage('Error booking appointment');
    }
  };

  const handleInputChange = (e) => {
    setAppointmentData({
      ...appointmentData,
      [e.target.name]: e.target.value
    });
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

// ============================================================================
// 3. Helper Components
// ============================================================================

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
          <InputField label="Preferred Date" type="date" name="date" value={appointmentData.date} onChange={onInputChange} min={new Date().toISOString().split('T')[0]} required />
          <SelectField label="Preferred Time" name="time" value={appointmentData.time} onChange={onInputChange} required>
            <option value="">Select Time</option>
            <option value="09:00">09:00 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="14:00">02:00 PM</option>
            <option value="16:00">04:00 PM</option>
          </SelectField>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
          <textarea name="reason" value={appointmentData.reason} onChange={onInputChange} rows="3" className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none" required />
        </div>
        <SelectField label="Priority" name="priority" value={appointmentData.priority} onChange={onInputChange}>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </SelectField>
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

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Check, X, Loader2, AlertTriangle, MessageSquare, Video, Hospital } from 'lucide-react';
import DoctorDashboardLayout from '/src/components/DoctorDashboardLayout.jsx';
import { getDoctorAppointments, updateAppointmentStatus, getDoctorProfile } from '/src/services/api.js';
import { format } from 'date-fns';

export default function DoctorAppointments() {
    const [activeTab, setActiveTab] = useState('Requests');
    const [appointments, setAppointments] = useState([]);
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            const [appointmentsRes, profileRes] = await Promise.all([
                getDoctorAppointments(),
                getDoctorProfile()
            ]);
            setAppointments(appointmentsRes.data);
            setDoctorProfile(profileRes.data);
        } catch (err) {
            setError('Failed to load appointment data.');
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [navigate]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateAppointmentStatus(id, status);
            fetchAllData(); 
        } catch (err) {
            setError('Could not update appointment status.');
        }
    };

    const filteredAppointments = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        switch (activeTab) {
            case 'Upcoming':
                return appointments.filter(a => a.status === 'confirmed' && new Date(a.appointment_date) >= today);
            case 'Past':
                return appointments.filter(a => ['completed', 'declined', 'cancelled'].includes(a.status) || (a.status === 'confirmed' && new Date(a.appointment_date) < today));
            case 'Requests':
                return appointments.filter(a => a.status === 'requested');
            default: return [];
        }
    }, [activeTab, appointments]);

    return (
        <DoctorDashboardLayout activeItem="appointments" userProfile={doctorProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Manage Appointments</h1>
                <p className="text-slate-500 mt-1">Review and manage your patient appointments.</p>
            </div>

            <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200/80 mb-6 flex items-center gap-2">
                <TabButton active={activeTab === 'Requests'} onClick={() => setActiveTab('Requests')}>Requests</TabButton>
                <TabButton active={activeTab === 'Upcoming'} onClick={() => setActiveTab('Upcoming')}>Upcoming</TabButton>
                <TabButton active={activeTab === 'Past'} onClick={() => setActiveTab('Past')}>Past</TabButton>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3"><AlertTriangle size={20} />{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map(app => (
                            <AppointmentCard key={app._id} appointment={app} onUpdate={handleStatusUpdate} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
                            <Calendar size={40} className="mx-auto text-slate-400" />
                             <h3 className="mt-4 text-lg font-semibold text-slate-700">No Appointments Found</h3>
                            <p className="mt-1 text-sm">There are no {activeTab.toLowerCase()} appointments.</p>
                        </div>
                    )}
                </div>
            )}
        </DoctorDashboardLayout>
    );
}

// Helper Components
const TabButton = ({ active, onClick, children }) => <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${active ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>{children}</button>;

const AppointmentCard = ({ appointment, onUpdate }) => {
    const { patientId: patient, status, type } = appointment;
    const isRequest = status === 'requested';

    const typeIcons = { video: <Video size={16} className="text-purple-600" />, clinic: <Hospital size={16} className="text-blue-600" />, phone: <MessageSquare size={16} className="text-green-600" /> };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient?.name}`} alt={patient?.name} className="w-12 h-12 rounded-full bg-slate-100" />
                    <div>
                        <h4 className="font-bold text-slate-800">{patient?.name || 'Unknown Patient'}</h4>
                        <p className="text-sm text-slate-500">Med ID: {patient?.med_id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 capitalize text-xs font-semibold py-1 px-2.5 rounded-full bg-slate-100 text-slate-600">
                   {typeIcons[type]} {type}
                </div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-lg text-sm space-y-2">
                <InfoRow icon={<Calendar size={16} />} label="Date" value={format(new Date(appointment.appointment_date), 'MMMM d, yyyy')} />
                <InfoRow icon={<Clock size={16} />} label="Time" value={appointment.appointment_time} />
                <InfoRow icon={<User size={16} />} label="Reason" value={appointment.reason} />
            </div>

            {isRequest && (
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button onClick={() => onUpdate(appointment._id, 'confirmed')} className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 transition-all">
                        <Check size={16} /> Confirm
                    </button>
                    <button onClick={() => onUpdate(appointment._id, 'declined')} className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg bg-slate-200 text-slate-600 font-semibold hover:bg-slate-300 transition-all">
                        <X size={16} /> Decline
                    </button>
                </div>
            )}
        </div>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start text-slate-600">
        <span className="text-slate-400 mt-0.5">{icon}</span>
        <span className="ml-2.5 font-medium w-16">{label}:</span>
        <span className="ml-2 font-semibold text-slate-700 flex-1">{value}</span>
    </div>
);


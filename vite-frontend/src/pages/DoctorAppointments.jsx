import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Calendar, Users, MessageSquare, Settings, LogOut, HeartPulse, 
    Video, Phone, MoreHorizontal, CheckCircle, XCircle, Clock, Search, User, CalendarDays
} from 'lucide-react';


import DoctorDashboardLayout from '../components/DoctorDashboardLayout'; 
import StatCard from '../components/StatCard';

// ============================================================================
// 2. DUMMY DATA FOR DEMONSTRATION
// ============================================================================
const dummyAppointments = {
    upcoming: [
        { id: 1, patient: { name: 'John Doe', avatar: 'JD' }, time: '09:00 AM', date: '2025-09-01', type: 'video', reason: 'Follow-up Consultation' },
        { id: 2, patient: { name: 'Jane Smith', avatar: 'JS' }, time: '10:30 AM', date: '2025-09-01', type: 'clinic', reason: 'Annual Check-up' },
        { id: 3, patient: { name: 'Peter Jones', avatar: 'PJ' }, time: '11:15 AM', date: '2025-09-02', type: 'phone', reason: 'Prescription Refill' },
    ],
    past: [
        { id: 4, patient: { name: 'Alice Williams', avatar: 'AW' }, time: '02:00 PM', date: '2025-08-28', status: 'completed' },
        { id: 5, patient: { name: 'Bob Brown', avatar: 'BB' }, time: '04:00 PM', date: '2025-08-25', status: 'cancelled' },
    ],
    requests: [
        { id: 6, patient: { name: 'Charlie Davis', avatar: 'CD' }, time: 'Anytime', date: '2025-09-03', reason: 'Sore throat and fever' },
        { id: 7, patient: { name: 'Diana Miller', avatar: 'DM' }, time: 'Morning', date: '2025-09-04', reason: 'Initial Consultation' },
    ]
};


export default function DoctorAppointments() {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [appointments, setAppointments] = useState(dummyAppointments);
    const [doctorProfile, setDoctorProfile] = useState(null);
    const navigate = useNavigate();
    
    // Mock fetching doctor's profile on component mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        // In a real app, you would fetch this data from your API
        setDoctorProfile({
            name: "Dr. Emily Carter",
            specialization: "Cardiologist"
        });
    }, [navigate]);

    const renderContent = () => {
        switch (activeTab) {
            case 'upcoming':
                return <AppointmentList data={appointments.upcoming} type="upcoming" />;
            case 'past':
                return <AppointmentList data={appointments.past} type="past" />;
            case 'requests':
                return <AppointmentList data={appointments.requests} type="requests" />;
            default:
                return null;
        }
    };

    return (
        <DoctorDashboardLayout activeItem="schedule" userProfile={doctorProfile}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Appointments</h1>
                    <p className="text-slate-500 mt-1">Manage your patient appointments and requests.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search patients..."
                        className="w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                    />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<CalendarDays size={24} className="text-sky-600" />} title="Upcoming Today" value={appointments.upcoming.filter(a => a.date === '2025-09-01').length} color="bg-sky-100" />
                <StatCard icon={<CheckCircle size={24} className="text-emerald-600" />} title="Completed This Week" value={appointments.past.filter(a => a.status === 'completed').length} color="bg-emerald-100" />
                <StatCard icon={<User size={24} className="text-amber-600" />} title="New Requests" value={appointments.requests.length} color="bg-amber-100" />
            </div>

            {/* Tabs */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200/80 mb-6 inline-flex gap-2">
                <TabButton title="Upcoming" isActive={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} count={appointments.upcoming.length} />
                <TabButton title="Past" isActive={activeTab === 'past'} onClick={() => setActiveTab('past')} />
                <TabButton title="Requests" isActive={activeTab === 'requests'} onClick={() => setActiveTab('requests')} count={appointments.requests.length} />
            </div>

            {/* Content Area */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                {renderContent()}
            </div>
        </DoctorDashboardLayout>
    );
}



const TabButton = ({ title, isActive, onClick, count }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
            isActive ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        {title}
        {count > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-200'}`}>
                {count}
            </span>
        )}
    </button>
);

const AppointmentList = ({ data, type }) => (
    <div className="space-y-4">
        {data.length > 0 ? (
            data.map(appt => <AppointmentCard key={appt.id} appointment={appt} type={type} />)
        ) : (
            <p className="text-center text-slate-500 py-8">No appointments found.</p>
        )}
    </div>
);

const AppointmentCard = ({ appointment, type }) => {
    const { patient, time, date, reason, type: meetingType, status } = appointment;
    
    const renderActions = () => {
        if (type === 'requests') {
            return (
                <div className="flex gap-2">
                    <button className="text-xs font-semibold py-1.5 px-3 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Approve</button>
                    <button className="text-xs font-semibold py-1.5 px-3 rounded bg-slate-200 text-slate-600 hover:bg-slate-300">Decline</button>
                </div>
            );
        }
        return (
             <div className="flex items-center gap-4">
                {meetingType === 'video' && <button className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold hover:text-emerald-700"><Video size={16} /> Join Call</button>}
                <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
            </div>
        );
    };

    const getStatusIndicator = () => {
        if (status === 'completed') return <CheckCircle size={20} className="text-emerald-500" />;
        if (status === 'cancelled') return <XCircle size={20} className="text-red-500" />;
        return <Clock size={20} className="text-slate-500" />;
    };

    return (
        <div className="flex items-center p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mr-4">
                {type === 'past' ? getStatusIndicator() : (
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.avatar}`} alt={patient.name} className="w-10 h-10 rounded-full" />
                )}
            </div>
            <div className="flex-1 grid grid-cols-3 items-center">
                <div>
                    <p className="font-bold text-slate-800">{patient.name}</p>
                    <p className="text-sm text-slate-500">{reason || `Status: ${status}`}</p>
                </div>
                <div className="text-slate-600 text-sm flex items-center gap-2">
                   {meetingType === 'video' && <Video size={16} />}
                   {meetingType === 'clinic' && <HeartPulse size={16} />}
                   {meetingType === 'phone' && <Phone size={16} />}
                   <span className="capitalize">{meetingType} visit</span>
                </div>
                 <div className="text-right flex items-center justify-end gap-6">
                    <div>
                        <p className="font-mono text-sm font-semibold text-emerald-600">{time}</p>
                        <p className="text-xs text-slate-500">{date}</p>
                    </div>
                    {renderActions()}
                </div>
            </div>
        </div>
    );
};

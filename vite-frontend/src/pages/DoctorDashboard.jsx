import React , {useState , useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, UserPlus, Calendar, MoreHorizontal, Check, X, Loader2, FlaskConical } from 'lucide-react'; // FlaskConical added
import DoctorDashboardLayout from '/src/components/DoctorDashboardLayout.jsx';
import StatCard from '/src/components/StatCard.jsx';
import { getDoctorProfile, getDoctorAppointments, updateAppointmentStatus } from '/src/services/api.js';
import { format, isToday } from 'date-fns';
import DoctorRequestReportModal from '/src/components/DoctorRequestReportModal.jsx'; // Modal added




export default function DoctorDashboard() {
    const [profile, setProfile] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // NEW: State for modal visibility
    const navigate = useNavigate();


    const fetchDashboardData = async () => {
        // Keep loading true while re-fetching
        setError('');
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
            const [profileRes, appointmentsRes] = await Promise.all([
                getDoctorProfile(),
                getDoctorAppointments()
            ]);
            setProfile(profileRes.data);
            setAppointments(appointmentsRes.data);
        } catch (err) {
            setError("Failed to load dashboard data.");
            if (err.response?.status === 401) navigate("/login");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDashboardData();
    }, [navigate]);


    const handleStatusUpdate = async (id, status) => {
        try {
            await updateAppointmentStatus(id, status);
            fetchDashboardData(); // Refresh all data after an update
        } catch (err) {
            setError('Could not update appointment status.');
        }
    };


    const { todaysAppointments, pendingRequests } = useMemo(() => {
        const todays = appointments.filter(a => a.status === 'confirmed' && isToday(new Date(a.appointment_date)));
        const requests = appointments.filter(a => a.status === 'requested');
        return { todaysAppointments: todays, pendingRequests: requests };
    }, [appointments]);


    if (loading) {
        return (
             <div className="w-screen h-screen flex justify-center items-center bg-slate-100">
                <Loader2 className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }


    return (
        <DoctorDashboardLayout activeItem="dashboard" userProfile={profile}>
            <div className="flex justify-between items-center mb-8"> {/* Modified for button layout */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Welcome back, {profile ? `Dr. ${profile.name.split(' ')[0]}` : ''}!
                    </h1>
                    <p className="text-slate-500 mt-1">Here’s what your day looks like.</p>
                </div>
                {/* NEW: Request Lab Test Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 transition-colors"
                >
                    <FlaskConical size={20} />
                    Request Lab Test
                </button>
            </div>
           
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-6">{error}</p>}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard icon={<Calendar size={24} className="text-sky-600" />} title="Today's Appointments" value={todaysAppointments.length} color="bg-sky-100" />
                <StatCard icon={<UserPlus size={24} className="text-amber-600" />} title="Pending Requests" value={pendingRequests.length} color="bg-amber-100" />
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Today's Schedule</h3>
                    <div className="space-y-4">
                        {todaysAppointments.length > 0 ? todaysAppointments.map(appt => (
                            <AppointmentItem key={appt._id} appointment={appt} />
                        )) : <EmptyState message="You have no appointments scheduled for today." />}
                    </div>
                </div>


                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Appointment Requests</h3>
                     <div className="space-y-3">
                        {pendingRequests.length > 0 ? pendingRequests.map(req => (
                            <RequestItem key={req._id} request={req} onUpdate={handleStatusUpdate} />
                        )) : <EmptyState message="You have no new appointment requests." />}
                    </div>
                </div>
            </div>


            {/* NEW: Modal Component Integration */}
            <DoctorRequestReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </DoctorDashboardLayout>
    );
}




// Helper Components for the Dashboard
const AppointmentItem = ({ appointment }) => (
    <div className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
        <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mr-4">
            <Clock size={24} className="text-slate-500" />
        </div>
        <div className="flex-1">
            <p className="font-semibold text-slate-800">{appointment.patientId?.name || 'N/A'}</p>
            <p className="text-sm text-slate-500">{appointment.reason}</p>
        </div>
        <div className="text-right">
            <p className="font-mono text-sm font-semibold text-emerald-600">{appointment.appointment_time}</p>
            <Link to="/doctor/appointments" className="text-slate-400 hover:text-slate-600 mt-1 inline-block"><MoreHorizontal size={20} /></Link>
        </div>
    </div>
);


const RequestItem = ({ request, onUpdate }) => (
    <div className="bg-slate-50 p-4 rounded-lg border">
        <p className="font-semibold text-slate-800">{request.patientId?.name || 'N/A'}</p>
        <p className="text-xs text-slate-500 mb-1">
            {format(new Date(request.appointment_date), 'MMMM d, yyyy')} at {request.appointment_time}
        </p>
        <p className="text-sm text-slate-500 mb-3">{request.reason}</p>
        <div className="flex gap-2">
            <button onClick={() => onUpdate(request._id, 'confirmed')} className="flex-1 text-xs py-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold flex items-center justify-center gap-1"><Check size={14}/> Approve</button>
            <button onClick={() => onUpdate(request._id, 'declined')} className="flex-1 text-xs py-1.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 font-semibold flex items-center justify-center gap-1"><X size={14}/> Decline</button>
        </div>
    </div>
);


const EmptyState = ({ message }) => (
    <div className="text-center py-10">
        <p className="text-sm text-slate-500">{message}</p>
    </div>
);




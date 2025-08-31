import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MoreHorizontal, UserPlus, Loader2, Calendar, MessageSquare } from 'lucide-react';
import DoctorDashboardLayout from '../components/DoctorDashboardLayout';
import StatCard from '../components/StatCard';

export default function DoctorDashboard() {
    const [doctorData, setDoctorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // --- Mock data for demonstration ---
    const stats = {
        appointments: 12,
        requests: 3,
        messages: 5
    };
    const appointments = [
        { time: '09:00 AM', patient: 'John Doe', reason: 'Follow-up Consultation' },
        { time: '10:30 AM', patient: 'Jane Smith', reason: 'Annual Check-up' },
        { time: '11:15 AM', patient: 'Peter Jones', reason: 'Prescription Refill' },
    ];
    const requests = [
        { patient: 'Alice Williams', reason: 'Sore throat and fever' },
        { patient: 'Bob Brown', reason: 'Initial Consultation' },
    ];

    // --- Fetch doctor's profile on load ---
    useEffect(() => {
        const fetchDoctorProfile = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                const res = await fetch("http://localhost:3001/api/doctor/profile", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Error fetching profile");
                }

                setDoctorData(data);
            } catch (err) {
                setError(err.message || "Server error");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorProfile();
    }, [navigate]);

    if (loading) {
        return (
             <div className="w-screen h-screen flex justify-center items-center bg-slate-100">
                <Loader2 className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-screen h-screen flex justify-center items-center bg-slate-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h3 className="text-red-600 font-semibold">An Error Occurred</h3>
                    <p className="text-slate-600 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <DoctorDashboardLayout activeItem="dashboard" userProfile={doctorData}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">
                    Welcome back, Dr. {doctorData ? doctorData.name : ''}!
                </h1>
                <p className="text-slate-500 mt-1">Here’s what your day looks like.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<Calendar size={24} className="text-sky-600" />} title="Today's Appointments" value={stats.appointments} color="bg-sky-100" />
                <StatCard icon={<UserPlus size={24} className="text-amber-600" />} title="Pending Requests" value={stats.requests} color="bg-amber-100" />
                <StatCard icon={<MessageSquare size={24} className="text-emerald-600" />} title="Unread Messages" value={stats.messages} color="bg-emerald-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Today's Schedule</h3>
                    <div className="space-y-4">
                        {appointments.map((appt, index) => (
                            <div key={index} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mr-4">
                                    <Clock size={24} className="text-slate-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800">{appt.patient}</p>
                                    <p className="text-sm text-slate-500">{appt.reason}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-semibold text-emerald-600">{appt.time}</p>
                                    <button className="text-slate-400 hover:text-slate-600 mt-1"><MoreHorizontal size={20} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Appointment Requests</h3>
                     <div className="space-y-3">
                        {requests.map((req, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg">
                                <p className="font-semibold text-slate-800">{req.patient}</p>
                                <p className="text-sm text-slate-500 mb-3">{req.reason}</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 text-xs py-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Approve</button>
                                    <button className="flex-1 text-xs py-1.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300">Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DoctorDashboardLayout>
    );
}
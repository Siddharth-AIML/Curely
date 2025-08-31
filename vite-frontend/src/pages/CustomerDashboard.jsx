import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from '../components/DashboardLayout'; // Adjust path as needed
import { Calendar, FileText, MessageSquare, Heart, ArrowRight } from 'lucide-react';

// Reusable card component for the dashboard sections
const DashboardCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);


export default function CustomerDashboard() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await fetch("http://localhost:3001/api/customer/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
        } else {
          console.error(data.msg || "Failed to fetch profile");
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  const nextAppointment = {
    doctor: "Dr. Emily Carter",
    type: "General Checkup",
    date: "July 15, 2024",
    time: "10:00 AM",
  };

  return (
    <DashboardLayout activeItem="dashboard" userProfile={profile}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Welcome back, {profile ? profile.name.split(' ')[0] : ''}!
        </h1>
        <p className="text-slate-500 mt-1">Here's a summary of your health dashboard.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardCard icon={<Calendar size={20} />} title="Upcoming Appointment">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="font-bold text-slate-800">{nextAppointment.doctor}</p>
              <p className="text-sm text-slate-600">{nextAppointment.type}</p>
              <p className="text-sm text-slate-500 mt-1">{nextAppointment.date} at {nextAppointment.time}</p>
            </div>
            <button className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-2">
              View All Appointments <ArrowRight size={16} />
            </button>
          </DashboardCard>

          <DashboardCard icon={<FileText size={20} />} title="Recent Health Records">
             <ul className="space-y-3">
               <li className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-700">Recent Blood Test</p>
                    <p className="text-xs text-slate-500">Updated: June 20, 2024</p>
                  </div>
                  <a href="#" className="text-xs font-bold text-emerald-600">VIEW</a>
               </li>
               <li className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-700">Allergy Information</p>
                    <p className="text-xs text-slate-500">Updated: May 15, 2024</p>
                  </div>
                  <a href="#" className="text-xs font-bold text-emerald-600">VIEW</a>
               </li>
             </ul>
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <DashboardCard icon={<MessageSquare size={20} />} title="Messages">
            <p className="text-sm text-slate-600">You have 2 unread messages.</p>
             <button className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-2">
              Go to Inbox <ArrowRight size={16} />
            </button>
          </DashboardCard>
          <DashboardCard icon={<Heart size={20} />} title="Health Tip">
             <p className="font-semibold text-slate-700">Stay Hydrated</p>
             <p className="text-sm text-slate-500 mt-1">Drinking enough water is essential for your overall health and well-being.</p>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

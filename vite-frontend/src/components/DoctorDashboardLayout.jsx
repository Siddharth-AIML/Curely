import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Calendar, Users, MessageSquare, Settings, LogOut, HeartPulse, BookUser, FileText
} from 'lucide-react';

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

function DoctorSidebar({ activeItem, userProfile }) {
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
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name || 'Doctor'}`}
          alt="Profile Avatar"
          className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-emerald-500/50"
        />
        <h4 className="font-semibold text-slate-100">{userProfile?.name ? `Dr. ${userProfile.name}` : 'Loading...'}</h4>
        <p className="text-xs text-slate-400 truncate">{userProfile?.specialization}</p>
      </div>

      <nav className="flex-1">
        <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" active={activeItem === 'dashboard'} onClick={() => handleNavigation('/dashboard/doctor')} />
        <SidebarItem icon={<Calendar size={20} />} text="Appointments" active={activeItem === 'appointments'} onClick={() => handleNavigation('/doctor/appointments')} />
        <SidebarItem icon={<BookUser size={20} />} text="Prescriptions" active={activeItem === 'prescriptions'} onClick={() => handleNavigation('/doctor/prescriptions')} />
        <SidebarItem icon={<FileText size={20} />} text="Reports" active={activeItem === 'reports'} onClick={() => handleNavigation('/doctor/reports')} />
      </nav>

      <div>
        <SidebarItem icon={<Settings size={20} />} text="Settings" active={activeItem === 'settings'} onClick={() => handleNavigation('/doctor/settings')} />
        <SidebarItem icon={<LogOut size={20} />} text="Logout" onClick={handleLogout} />
      </div>
    </aside>
  );
}

export default function DoctorDashboardLayout({ children, activeItem, userProfile }) {
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <DoctorSidebar activeItem={activeItem} userProfile={userProfile} />
      <div className="ml-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}


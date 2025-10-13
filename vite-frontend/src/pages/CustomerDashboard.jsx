import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from '/src/components/DashboardLayout.jsx';
import { getCustomerProfile, getCustomerAppointments, getCustomerPrescriptions, getCustomerReports } from '/src/services/api.js';
import { Calendar, FileText, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ChatbotFloatingButton from "../components/ChatbotFloatingButton.jsx";


// Reusable card component for the dashboard sections
const DashboardCard = ({ icon, title, children, linkTo }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-full">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="flex-grow">{children}</div>
    {linkTo && (
        <Link to={linkTo} className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-2">
            View All <ArrowRight size={16} />
        </Link>
    )}
  </div>
);




export default function CustomerDashboard() {
  const [profile, setProfile] = useState(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [recentPrescription, setRecentPrescription] = useState(null);
  const [recentReport, setRecentReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }


        // Fetch all data in parallel
        const [profileRes, appointmentsRes, prescriptionsRes, reportsRes] = await Promise.all([
            getCustomerProfile(),
            getCustomerAppointments(),
            getCustomerPrescriptions(),
            getCustomerReports()
        ]);
       
        setProfile(profileRes.data);


        // Find the next upcoming appointment
        const upcoming = appointmentsRes.data
            .filter(a => new Date(a.appointment_date) >= new Date() && a.status === 'confirmed')
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
       
        if (upcoming.length > 0) {
            setUpcomingAppointment(upcoming[0]);
        }


        // Find the most recent prescription and report
        if (prescriptionsRes.data.length > 0) setRecentPrescription(prescriptionsRes.data[0]);
        if (reportsRes.data.length > 0) setRecentReport(reportsRes.data[0]);
       
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);


  if (loading) {
      return (
          <div className="w-screen h-screen flex justify-center items-center bg-slate-100">
              <Loader2 className="animate-spin text-emerald-600" size={48} />
          </div>
      );
  }


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
          <DashboardCard icon={<Calendar size={20} />} title="Upcoming Appointment" linkTo="/customer/appointments">
            {upcomingAppointment ? (
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="font-bold text-slate-800">Dr. {upcomingAppointment.doctorId?.name}</p>
                  <p className="text-sm text-slate-600">{upcomingAppointment.doctorId?.specialization}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {format(new Date(upcomingAppointment.appointment_date), 'MMMM d, yyyy')} at {upcomingAppointment.appointment_time}
                  </p>
                </div>
            ) : (
                <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">You have no upcoming appointments.</p>
            )}
          </DashboardCard>


          <DashboardCard icon={<FileText size={20} />} title="Recent Health Records">
             <ul className="space-y-3">
                {recentPrescription ? (
                    <RecordItem
                        title="Latest Prescription"
                        date={recentPrescription.date}
                        link="/customer/prescriptions"
                    />
                ) : (
                    <p className="text-sm text-slate-500">No prescriptions on record.</p>
                )}
                 {recentReport ? (
                    <RecordItem
                        title="Latest Report"
                        subtitle={recentReport.title}
                        date={recentReport.date}
                        link="/customer/reports"
                    />
                ) : (
                    <p className="text-sm text-slate-500 mt-2">No reports on record.</p>
                )}
             </ul>
          </DashboardCard>
        </div>


        <div className="space-y-6">
          <DashboardCard icon={<Heart size={20} />} title="Health Tip of the Day">
             <p className="font-semibold text-slate-700">Stay Hydrated</p>
             <p className="text-sm text-slate-500 mt-1">Drinking enough water is essential for your overall health and well-being. It helps regulate body temperature, keep joints lubricated, and deliver nutrients to cells.</p>
          </DashboardCard>
        </div>
      </div>
     <ChatbotFloatingButton />
    </DashboardLayout>
  );
}


const RecordItem = ({ title, subtitle, date, link }) => {
    // Check if a date value exists and if it can be parsed into a valid Date object
    let displayDate = 'N/A';
    if (date) {
        const dateObj = new Date(date);
        // CRITICAL CHECK: Check for "Invalid Date" by checking getTime()
        if (!isNaN(dateObj.getTime())) {
            displayDate = format(dateObj, 'MMMM d, yyyy');
        }
    }


    return (
        <li className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50">
            <div>
                <p className="font-medium text-slate-700">{title}</p>
                {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
                <p className="text-xs text-slate-500">
                    Updated: {displayDate}
                </p>
            </div>
            <Link to={link} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1 px-3 rounded-full">
                VIEW
            </Link>
        </li>
    );
};




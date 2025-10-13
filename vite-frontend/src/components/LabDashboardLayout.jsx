import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, Settings, Menu, X, CheckCircle } from 'lucide-react';

// NOTE: This component might need its own API call (e.g., getLabProfile) 
// to fetch the user name for the header. Assuming it is implemented in the API.
// import { getLabProfile } from '/src/services/api.js'; 

const navItems = [
    { name: 'Dashboard', path: '/dashboard/lab', icon: LayoutDashboard },
    { name: 'Reports Queue', path: '/lab/reports', icon: FileText },
    { name: 'Settings', path: '/lab/settings', icon: Settings },
];

export default function LabDashboardLayout({ children, activeItem }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [labProfile, setLabProfile] = useState(null);
    const navigate = useNavigate();
    
    // Placeholder for profile fetch. You might need to uncomment and implement this:
    /*
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await getLabProfile();
                setLabProfile(data);
            } catch (error) {
                console.error("Failed to fetch lab profile for layout:", error);
                // Optionally redirect to login if auth token is expired/missing
            }
        };
        fetchProfile();
    }, []);
    */

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole'); // Assuming you store role here
        navigate('/login');
    };

    const sidebarClass = isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';
    const profile = labProfile || { name: "Lab User", isApproved: true }; // Placeholder data

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-40 p-2 text-gray-600 bg-white rounded-lg shadow-md"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black opacity-50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarClass} lg:relative lg:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6 text-2xl font-extrabold text-teal-600 border-b">
                        Curely <span className="text-gray-400 text-sm">LAB</span>
                    </div>

                    <div className="flex-grow p-4 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={({ isActive }) => 
                                    `flex items-center p-3 rounded-lg transition-colors duration-150 ease-in-out ${
                                        isActive 
                                            ? 'bg-teal-500 text-white shadow-md' 
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="p-4 border-t">
                        {/* Lab Info Card */}
                        <div className={`p-3 rounded-lg mb-4 ${profile.isApproved ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-semibold">{profile.isApproved ? 'APPROVED' : 'PENDING'}</span>
                            </div>
                            <p className="text-sm font-medium mt-1 text-gray-800 truncate">{profile.name}</p>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            <span className="font-medium">Log Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                {children}
            </main>
        </div>
    );
}
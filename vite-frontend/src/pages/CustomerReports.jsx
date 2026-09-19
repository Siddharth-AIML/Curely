import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Printer, Loader2, AlertTriangle, X, HeartPulse } from 'lucide-react';
import DashboardLayout from '/src/components/DashboardLayout.jsx';
import { getCustomerReports, getCustomerProfile } from '/src/services/api.js';
import ItemViewModal from '/src/components/ItemViewModal.jsx';
import { format } from 'date-fns';

export default function CustomerReports() {
    const [reports, setReports] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [profileRes, reportsRes] = await Promise.all([
                    getCustomerProfile(),
                    getCustomerReports()
                ]);
                setUserProfile(profileRes.data);
                setReports(reportsRes.data);
            } catch (err) {
                setError('Failed to fetch your reports.');
                 if (err.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    return (
        <DashboardLayout activeItem="reports" userProfile={userProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Your Medical Reports</h1>
                <p className="text-slate-500 mt-1">A record of all your medical reports and findings.</p>
            </div>
            {loading ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>
            ) : error ? (
                <div className="text-center py-20 text-red-600 bg-red-50 p-4 rounded-lg flex items-center justify-center gap-3">
                    <AlertTriangle /> {error}
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.length > 0 ? reports.map(r => (
                        <ItemCard key={r._id} item={r} onSelect={() => setSelectedItem(r)} type="Report" />
                    )) : (
                         <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border">
                             <FileText size={40} className="mx-auto text-slate-400" />
                             <h3 className="mt-4 text-lg font-semibold text-slate-700">No Reports Found</h3>
                             <p className="mt-1 text-sm">Your medical reports will appear here once created.</p>
                         </div>
                    )}
                </div>
            )}
            
            {selectedItem && (
                <ItemViewModal item={selectedItem} userProfile={userProfile} onClose={() => setSelectedItem(null)} type="Report" />
            )}
        </DashboardLayout>
    );
}

// Reusable Card for both Prescriptions and Reports
const ItemCard = ({ item, onSelect, type }) => {
    const doctorName = item.doctorId?.name || 'N/A';
    const title = type === 'Prescription' ? `Prescription from Dr. ${doctorName}` : item.testName || item.title; // Use testName from the new report structure

    // --- SAFE DATE PARSING FIX APPLIED HERE ---
    const dateValue = item.completedAt || item.requestedAt || item.date; // Check multiple possible fields
    let displayDate = 'N/A';
    
    if (dateValue) {
        const dateObj = new Date(dateValue);
        // CRITICAL CHECK: Ensure the date object is not "Invalid Date"
        if (!isNaN(dateObj.getTime())) {
            displayDate = format(dateObj, 'MMMM d, yyyy');
        }
    }
    // ------------------------------------------

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex justify-between items-center">
            <div>
                <p className="font-bold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 font-mono">
                    Date: {displayDate}
                </p>
            </div>
            <button onClick={onSelect} className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                View Details
            </button>
        </div>
    );
};


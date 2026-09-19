import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Printer, Loader2, AlertTriangle, X, HeartPulse } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { getCustomerPrescriptions, getCustomerProfile } from '../services/api.js';
import ItemViewModal from '../components/ItemViewModal.jsx';
import { format } from 'date-fns';

export default function CustomerPrescriptions() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [profileRes, presRes] = await Promise.all([
                    getCustomerProfile(),
                    getCustomerPrescriptions()
                ]);
                setUserProfile(profileRes.data);
                setPrescriptions(presRes.data);
            } catch (err) {
                setError(err.response?.data?.msg || 'Failed to fetch your prescriptions.');
                 if (err.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [navigate]);

    return (
        <DashboardLayout activeItem="prescriptions" userProfile={userProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Your Prescriptions</h1>
                <p className="text-slate-500 mt-1">Here is a list of all your medical prescriptions.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>
            ) : error ? (
                <div className="text-center py-20 text-red-600 bg-red-50 p-4 rounded-lg flex items-center justify-center gap-3">
                    <AlertTriangle /> {error}
                </div>
            ) : prescriptions.length > 0 ? (
                <div className="space-y-4">
                    {prescriptions.map((p) => (
                        <ItemCard key={p._id} item={p} onSelect={() => setSelectedItem(p)} type="Prescription" />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border">
                    <FileText size={40} className="mx-auto text-slate-400" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-700">No Prescriptions Found</h3>
                    <p className="mt-1 text-sm">Your prescriptions will appear here once created by a doctor.</p>
                </div>
            )}
            
            {selectedItem && (
                <ItemViewModal item={selectedItem} userProfile={userProfile} onClose={() => setSelectedItem(null)} type="Prescription" />
            )}
        </DashboardLayout>
    );
}

// Reusable Card for both Prescriptions and Reports
const ItemCard = ({ item, onSelect, type }) => {
    const doctorName = item.doctorId?.name || 'N/A';
    const title = type === 'Prescription' ? `Prescription from Dr. ${doctorName}` : item.title;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex justify-between items-center">
            <div>
                <p className="font-bold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 font-mono">
                    Date: {format(new Date(item.date), 'MMMM d, yyyy')}
                </p>
            </div>
            <button onClick={onSelect} className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                View Details
            </button>
        </div>
    );
};


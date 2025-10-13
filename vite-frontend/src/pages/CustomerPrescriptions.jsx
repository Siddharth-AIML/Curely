import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Printer, Loader2, AlertTriangle, X, HeartPulse } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { getCustomerPrescriptions, getCustomerProfile } from '../services/api.js';
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

// Reusable Modal for Viewing Details
const ItemViewModal = ({ item, userProfile, onClose, type }) => {
    const handlePrint = () => window.print();
    const doctorName = item.doctorId?.name || 'N/A';
    const doctorSpecialization = item.doctorId?.specialization || 'N/A';
    const isPrescription = type === 'Prescription';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl relative">
                <div id="printable-content" className="p-4">
                    <header className="flex justify-between items-start pb-4 border-b mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{type} Details</h2>
                            <p className="text-sm text-slate-500">Issued on {format(new Date(item.date), 'MMMM d, yyyy')}</p>
                        </div>
                         <div className="flex items-center gap-2 text-emerald-600">
                            <HeartPulse size={24} />
                            <span className="font-bold text-xl">Curely</span>
                        </div>
                    </header>
                    
                    <div className="grid grid-cols-2 gap-6 text-sm mb-6">
                        <div className="space-y-1">
                            <p className="text-slate-500">Patient</p>
                            <p className="font-semibold text-slate-800">{userProfile?.name}</p>
                            <p className="text-slate-600">Med ID: {userProfile?.med_id}</p>
                        </div>
                        <div className="space-y-1 text-right">
                             <p className="text-slate-500">Provider</p>
                            <p className="font-semibold text-slate-800">Dr. {doctorName}</p>
                            <p className="text-slate-600">{doctorSpecialization}</p>
                        </div>
                    </div>

                    {isPrescription ? (
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-2 border-b pb-1">Medicines</h3>
                            <ul className="space-y-3 mt-3">
                                {Array.isArray(item.medicines) && item.medicines.map((med, index) => (
                                    <li key={index} className="text-sm">
                                        <p className="font-bold text-slate-800">{med.name} <span className="font-medium text-slate-600">({med.dosage})</span></p>
                                        <p className="text-slate-600 pl-4">- {med.instructions}</p>
                                    </li>
                                ))}
                            </ul>
                            {item.notes && <div className="mt-4">
                                <h3 className="font-semibold text-slate-700 mb-1">Notes</h3>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border">{item.notes}</p>
                            </div>}
                        </div>
                    ) : (
                        <div>
                             <h3 className="font-semibold text-slate-700 mb-2 border-b pb-1">Report: {item.title}</h3>
                            <div className="mt-3 space-y-3 text-sm">
                                <p className="font-semibold text-slate-600">Summary:</p>
                                <p className="text-slate-700 whitespace-pre-wrap">{item.summary}</p>
                                {item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:underline">View Attached File</a>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t mt-4">
                    <button onClick={onClose} className="text-sm font-semibold text-slate-600 hover:text-slate-800">Close</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 text-sm py-2 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
                        <Printer size={16} /> Print / Save as PDF
                    </button>
                </div>
            </div>
             <PrintStyles />
        </div>
    );
};

// Helper component to inject print styles
const PrintStyles = () => (
    <style>{`
        @media print {
            body * { visibility: hidden; }
            #printable-content, #printable-content * { visibility: visible; }
            #printable-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
    `}</style>
);


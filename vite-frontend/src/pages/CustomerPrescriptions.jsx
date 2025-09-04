import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { getCustomerPrescriptions, getCustomerProfile } from '../services/api.js';
import { format } from 'date-fns';

export default function CustomerPrescriptions() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // First, fetch the user's profile to display in the sidebar
                const profileRes = await getCustomerProfile();
                setUserProfile(profileRes.data);

                // Then, fetch the prescriptions for the logged-in customer
                const presRes = await getCustomerPrescriptions();
                setPrescriptions(presRes.data);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError(err.response?.data?.msg || 'Failed to fetch your prescriptions.');
                 if (err.response?.status === 401) {
                    navigate('/login');
                }
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-emerald-600" size={32} />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
                    </div>
                ) : prescriptions.length > 0 ? (
                    <div className="space-y-4">
                        {prescriptions.map((p) => (
                            <PrescriptionCard key={p._id} prescription={p} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <FileText size={48} className="mx-auto text-slate-300" />
                        <h3 className="mt-4 text-lg font-semibold text-slate-700">No Prescriptions Found</h3>
                        <p className="mt-1 text-sm text-slate-500">Your prescriptions from doctors will appear here.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}


const PrescriptionCard = ({ prescription }) => {
    return (
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-slate-800">Prescription from Dr. {prescription.doctor.name}</p>
                    <p className="text-xs text-slate-500 font-mono">
                        Date: {format(new Date(prescription.date), 'MMMM d, yyyy')}
                    </p>
                </div>
                <button className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold">
                    <Download size={14} /> Download
                </button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
                 <h4 className="text-sm font-semibold text-slate-600 mb-2">Medications:</h4>
                 <ul className="space-y-2">
                    {prescription.medications.map((med, index) => (
                         <li key={index} className="text-sm text-slate-700 pl-4 border-l-2 border-emerald-200">
                            <strong>{med.name}</strong> ({med.dosage}) - {med.instructions}
                        </li>
                    ))}
                 </ul>
                 {prescription.notes && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-slate-600 mb-1">Notes:</h4>
                        <p className="text-sm text-slate-600 bg-slate-100 p-2 rounded">{prescription.notes}</p>
                    </div>
                 )}
            </div>
        </div>
    );
};


import React, { useState, useEffect } from 'react';
import { FileText, Loader2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { getCustomerReports, getCustomerProfile } from '../services/api.js';
import { format } from 'date-fns';

export default function CustomerReports() {
    const [reports, setReports] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, reportsRes] = await Promise.all([
                    getCustomerProfile(),
                    getCustomerReports()
                ]);
                setUserProfile(profileRes.data);
                setReports(reportsRes.data);
            } catch (err) {
                setError('Failed to fetch your reports.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <DashboardLayout activeItem="reports" userProfile={userProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Your Medical Reports</h1>
                <p className="text-slate-500 mt-1">A record of all your medical reports and findings.</p>
            </div>
             {loading ? (
                 <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3"><AlertTriangle size={20} />{error}</div>
            ) : (
                <div className="space-y-6">
                    {reports.length > 0 ? reports.map(r => (
                        <div key={r._id} className="bg-white p-6 rounded-2xl shadow-sm border">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{r.title}</h3>
                                    <p className="text-sm text-slate-500">Report by Dr. {r.doctorId.name}</p>
                                </div>
                                <p className="text-sm font-semibold text-slate-600 bg-slate-100 py-1 px-3 rounded-full">
                                    {format(new Date(r.date), 'MMMM d, yyyy')}
                                </p>
                            </div>
                             <div className="mt-4 pt-4 border-t text-sm space-y-3">
                                <p><strong>Findings:</strong> {r.findings}</p>
                                {r.recommendations && <p><strong>Recommendations:</strong> {r.recommendations}</p>}
                            </div>
                        </div>
                    )) : (
                         <div className="text-center py-16 text-slate-500">
                            <p>You do not have any reports on record.</p>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}


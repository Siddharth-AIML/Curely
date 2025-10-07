import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FilePlus, Search, Loader2, X, Plus, KeyRound, ShieldCheck } from 'lucide-react';
import DoctorDashboardLayout from '../components/DoctorDashboardLayout.jsx';
import { createReport, getReportsByMedId, findCustomerByMedId, getDoctorProfile, sendPatientOTP, verifyPatientOTP } from '../services/api.js';
import { format } from 'date-fns';

export default function DoctorReports() {
    const [medId, setMedId] = useState('');
    const [searchedCustomer, setSearchedCustomer] = useState(null);
    const [isVerified, setIsVerified] = useState(false); // New state to track verification
    const [reports, setReports] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getDoctorProfile();
                setDoctorProfile(res.data);
            } catch (err) { console.error("Failed to fetch doctor profile", err); }
        };
        fetchProfile();
    }, []);

    const handleSearch = async () => {
        if (!medId) return setError('Please enter a Medical ID.');
        setSearchLoading(true);
        setError('');
        setSearchedCustomer(null);
        setIsVerified(false); // Reset verification on new search
        setReports([]);
        try {
            const customerRes = await findCustomerByMedId(medId);
            setSearchedCustomer(customerRes.data);
        } catch (err) {
            setError(err.response?.data?.msg || 'Patient not found.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleVerificationSuccess = async () => {
        setIsVerified(true);
        try {
            const reportsRes = await getReportsByMedId(searchedCustomer.med_id);
            setReports(reportsRes.data);
        } catch (err) {
            setError("Verification successful, but failed to fetch reports.");
        }
    };

    const openForm = () => {
        if (isVerified) {
            setError('');
            reset({ title: '', summary: '', fileUrl: ''});
            setIsFormOpen(true);
        } else {
            setError("Please verify access to the patient's records first.");
        }
    };
    
    const handleReportCreation = async (data) => {
        const reportData = { medId: searchedCustomer.med_id, ...data };
        await createReport(reportData);
        setIsFormOpen(false);
        const reportsRes = await getReportsByMedId(searchedCustomer.med_id);
        setReports(reportsRes.data);
    };

    return (
        <DoctorDashboardLayout activeItem="reports" userProfile={doctorProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Medical Reports</h1>
                <p className="text-slate-500 mt-1">Search for a patient and verify access to manage their reports.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
                <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label htmlFor="medId" className="block text-sm font-medium text-slate-700 mb-1">Patient Medical ID</label>
                         <div className="relative">
                            <input type="text" id="medId" value={medId} onChange={(e) => setMedId(e.target.value)} placeholder="Enter patient's Med_ID" className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg"/>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                    <button onClick={handleSearch} disabled={searchLoading} className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400">
                        {searchLoading ? <Loader2 className="animate-spin" /> : 'Search'}
                    </button>
                </div>
                 {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
            </div>
            
            {searchedCustomer && !isVerified && (
                <VerificationPrompt customer={searchedCustomer} onSuccess={handleVerificationSuccess} />
            )}

            {isVerified && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{`Report History for ${searchedCustomer.name}`}</h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {reports.length > 0 ? reports.map(r => (
                            <div key={r._id} className="p-4 rounded-lg bg-slate-50 border">
                                <p className="font-semibold">{r.title}</p>
                                <p className="text-sm text-slate-500">Date: {format(new Date(r.date), 'MMMM d, yyyy')}</p>
                                <p className="text-sm mt-2"><strong>Summary:</strong> {r.summary}</p>
                            </div>
                        )) : <p className="text-sm text-center text-slate-500 py-8">No past reports found for this patient.</p>}
                    </div>
                </div>
            )}

            {isFormOpen && (
                <ReportFormModal 
                    customer={searchedCustomer} 
                    onClose={() => setIsFormOpen(false)} 
                    onSubmit={handleReportCreation}
                    formMethods={{ register, handleSubmit }}
                />
            )}

            <button onClick={openForm} disabled={!isVerified} title={!isVerified ? "Verify patient access to enable" : "Create New Report"} className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-100">
                <Plus size={24} />
            </button>
        </DoctorDashboardLayout>
    );
}

// New Verification Component
const VerificationPrompt = ({ customer, onSuccess }) => {
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOTP = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await sendPatientOTP(customer.med_id);
            setMessage(res.data.msg);
            setOtpSent(true);
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        try {
            await verifyPatientOTP(customer.med_id, otp);
            onSuccess(); // Triggers parent component to show reports
        } catch (err) {
            setError(err.response?.data?.msg || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
            <ShieldCheck className="mx-auto w-12 h-12 text-amber-500 mb-3" />
            <h3 className="text-lg font-semibold text-slate-800">Verify Access</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">To protect patient privacy, you must verify access before viewing or creating reports for <strong>{customer.name}</strong>.</p>
            
            {!otpSent ? (
                <button onClick={handleSendOTP} disabled={loading} className="mt-6 px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 disabled:bg-amber-300">
                    {loading ? <Loader2 className="animate-spin" /> : 'Send Verification Code to Patient'}
                </button>
            ) : (
                <div className="mt-6 max-w-sm mx-auto space-y-3">
                    <p className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded-md">{message}</p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="input-field flex-grow"
                        />
                        <button onClick={handleVerify} disabled={loading} className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400">
                            {loading ? <Loader2 className="animate-spin" /> : 'Verify'}
                        </button>
                    </div>
                </div>
            )}
            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        </div>
    );
};


// Report Creation Modal (simplified)
const ReportFormModal = ({ customer, onClose, onSubmit, formMethods }) => {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit } = formMethods;

    const handleFormSubmit = async (data) => {
        setLoading(true);
        await onSubmit(data);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">New Report For: {customer.name}</h3>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <InputField label="Report Title" name="title" register={register} required />
                    <TextAreaField label="Summary" name="summary" register={register} required rows="6" />
                    <InputField label="File URL (Optional)" name="fileUrl" register={register} />
                    <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-emerald-400">
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Helper Components
const InputField = ({ label, ...props }) => (<div><label className="block text-sm font-medium text-slate-700 mb-1">{label}</label><input {...props} className="input-field" /></div>);
const TextAreaField = ({ label, name, register, ...rest }) => (<div><label className="block text-sm font-medium text-slate-700 mb-1">{label}</label><textarea {...register(name)} {...rest} className="input-field" /></div>);
const Placeholder = ({ text }) => (<div className="text-center py-20 text-slate-400"><Search size={40} className="mx-auto mb-3" /><p>{text}</p></div>);

const styles = `.input-field{width:100%;padding:8px 12px;font-size:14px;border:1px solid #cbd5e1;border-radius:8px;transition:box-shadow .2s}.input-field:focus{outline:0;box-shadow:0 0 0 2px rgba(16,185,129,.5);border-color:#10b981}`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


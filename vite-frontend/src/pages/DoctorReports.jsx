import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FilePlus, Search, Loader2, X, Plus } from 'lucide-react';
import DoctorDashboardLayout from '/src/components/DoctorDashboardLayout.jsx';
import { createReport, getReportsByMedId, findCustomerByMedId, getDoctorProfile } from '/src/services/api.js';
import { format } from 'date-fns';

export default function DoctorReports() {
    const [medId, setMedId] = useState('');
    const [searchedCustomer, setSearchedCustomer] = useState(null);
    const [reports, setReports] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState('');
    const [doctorProfile, setDoctorProfile] = useState(null);

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
        setReports([]);
        try {
            const customerRes = await findCustomerByMedId(medId);
            setSearchedCustomer(customerRes.data);
            const reportsRes = await getReportsByMedId(medId);
            setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
        } catch (err) {
            setError(err.response?.data?.msg || 'Patient not found or error fetching data.');
            setReports([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const openForm = () => {
        if (searchedCustomer) {
            setError('');
            setIsFormOpen(true);
        } else {
            setError("Please search for a patient before creating a report.");
        }
    };
    
    const onSubmit = async (data) => {
        if (!searchedCustomer || !searchedCustomer.med_id) {
            setError("Cannot create report. A patient must be selected.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const reportData = { 
                medId: searchedCustomer.med_id, 
                title: data.title,
                summary: data.summary,
                fileUrl: data.fileUrl
            };
            await createReport(reportData);
            reset({ title: '', summary: '', fileUrl: ''});
            setIsFormOpen(false);
            const reportsRes = await getReportsByMedId(searchedCustomer.med_id);
            setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to create report.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DoctorDashboardLayout activeItem="reports" userProfile={doctorProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Medical Reports</h1>
                <p className="text-slate-500 mt-1">Search for a patient to manage their medical reports.</p>
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{searchedCustomer ? `Report History for ${searchedCustomer.name}` : 'Search for a patient to see their history'}</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {searchedCustomer ? (reports.length > 0 ? reports.map(r => (
                        <div key={r._id} className="p-4 rounded-lg bg-slate-50 border">
                            <p className="font-semibold">{r.title}</p>
                            <p className="text-sm text-slate-500">Date: {format(new Date(r.date), 'MMMM d, yyyy')}</p>
                            <p className="text-sm mt-2"><strong>Summary:</strong> {r.summary}</p>
                        </div>
                    )) : <p className="text-sm text-center text-slate-500 py-8">No past reports found.</p>) : <Placeholder text="Patient's report history will appear here." />}
                </div>
            </div>

            {isFormOpen && <ReportFormModal {...{ searchedCustomer, handleSubmit, onSubmit, register, loading, setIsFormOpen }} />}

            <button onClick={openForm} disabled={!searchedCustomer} title={!searchedCustomer ? "Search for a patient to enable" : "Create New Report"} className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-100">
                <Plus size={24} />
            </button>
        </DoctorDashboardLayout>
    );
}

// Helper Components
const ReportFormModal = ({ searchedCustomer, handleSubmit, onSubmit, register, loading, setIsFormOpen }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-1">New Report For:</h3>
                <div className="flex items-baseline gap-2">
                    <p className="font-bold text-emerald-700 text-xl">{searchedCustomer.name}</p>
                    <p className="text-sm text-slate-500 font-mono">(Med ID: {searchedCustomer.med_id})</p>
                </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <InputField label="Report Title" name="title" register={register} required />
                <TextAreaField label="Summary" name="summary" register={register} required rows="6" />
                <InputField label="File URL (Optional)" name="fileUrl" register={register} />
                <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center justify-center">
                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <FilePlus className="mr-2" size={16} />} 
                    {loading ? 'Creating...' : 'Create Report'}
                </button>
            </form>
        </div>
    </div>
);

const InputField = ({ label, name, register, required }) => (<div><label className="block text-sm font-medium text-slate-700 mb-1">{label}</label><input {...register(name, { required })} className="input-field" /></div>);
const TextAreaField = ({ label, name, register, ...rest }) => (<div><label className="block text-sm font-medium text-slate-700 mb-1">{label}</label><textarea {...register(name)} {...rest} className="input-field" /></div>);
const Placeholder = ({ text }) => (<div className="text-center py-20 text-slate-400"><Search size={40} className="mx-auto mb-3" /><p>{text}</p></div>);

const styles = `.input-field{width:100%;padding:8px 12px;font-size:14px;border:1px solid #cbd5e1;border-radius:8px;transition:box-shadow .2s}.input-field:focus{outline:0;box-shadow:0 0 0 2px rgba(16,185,129,.5);border-color:#10b981}`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


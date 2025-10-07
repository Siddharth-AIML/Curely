import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Search, Loader2, FilePlus, X } from 'lucide-react';
import DoctorDashboardLayout from '/src/components/DoctorDashboardLayout.jsx';
import { createPrescription, getPrescriptionsByMedId, findCustomerByMedId, getDoctorProfile } from '/src/services/api.js';
import { format } from 'date-fns';

export default function DoctorPrescriptions() {
    const [medId, setMedId] = useState('');
    const [searchedCustomer, setSearchedCustomer] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState('');
    const [doctorProfile, setDoctorProfile] = useState(null);

    const { register, control, handleSubmit, reset } = useForm({
        defaultValues: { medicines: [{ name: '', dosage: '', instructions: '' }] }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "medicines" });

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
        setPrescriptions([]);
        try {
            const customerRes = await findCustomerByMedId(medId);
            setSearchedCustomer(customerRes.data);
            const presRes = await getPrescriptionsByMedId(medId);
            setPrescriptions(Array.isArray(presRes.data) ? presRes.data : []);
        } catch (err) {
            setError(err.response?.data?.msg || 'Patient not found or error fetching data.');
            setPrescriptions([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const openForm = () => {
        if (searchedCustomer) {
            setError('');
            setIsFormOpen(true);
        } else {
            setError("Please search for a patient before creating a prescription.");
        }
    };

    const onSubmit = async (data) => {
        // --- ADDED CLIENT-SIDE VALIDATION ---
        if (!searchedCustomer || !searchedCustomer.med_id) {
            setError("Cannot create prescription. A patient must be selected.");
            return;
        }
        if (!data.medicines || data.medicines.length === 0) {
            setError("Cannot create prescription. At least one medicine is required.");
            return;
        }

        setLoading(true);
        setError(''); // Clear previous errors before submitting
        try {
            const prescriptionData = { 
                medId: searchedCustomer.med_id, 
                medicines: data.medicines,
                notes: data.notes
            };
            await createPrescription(prescriptionData);
            reset({ notes: '', medicines: [{ name: '', dosage: '', instructions: '' }] });
            setIsFormOpen(false);
            const presRes = await getPrescriptionsByMedId(searchedCustomer.med_id);
            setPrescriptions(Array.isArray(presRes.data) ? presRes.data : []);
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to create prescription.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <DoctorDashboardLayout activeItem="prescriptions" userProfile={doctorProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Prescriptions</h1>
                <p className="text-slate-500 mt-1">Search for a patient to view or create prescriptions.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
                <div className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label htmlFor="medId" className="block text-sm font-medium text-slate-700 mb-1">Patient Medical ID</label>
                        <div className="relative">
                            <input type="text" id="medId" value={medId} onChange={(e) => setMedId(e.target.value)} placeholder="Enter patient's Med_ID" className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg" />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                    <button onClick={handleSearch} disabled={searchLoading} className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center justify-center">
                        {searchLoading ? <Loader2 className="animate-spin" /> : 'Search'}
                    </button>
                </div>
                {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{searchedCustomer ? `History for ${searchedCustomer.name}` : 'Search for a patient to see their history'}</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {searchedCustomer ? (prescriptions.length > 0 ? prescriptions.map(p => (
                        <div key={p._id} className="p-4 rounded-lg bg-slate-50 border">
                            <p className="font-semibold text-slate-700">Date: {format(new Date(p.date), 'MMMM d, yyyy')}</p>
                            <ul className="mt-2 space-y-1">
                                {Array.isArray(p.medicines) && p.medicines.map((med, i) => (
                                    <li key={i} className="text-sm text-slate-600 list-disc list-inside ml-4">
                                        {med.name} ({med.dosage}) - {med.instructions}
                                    </li>
                                ))}
                            </ul>
                            {p.notes && <p className="text-sm mt-2 pt-2 border-t border-slate-200"><strong>Notes:</strong> {p.notes}</p>}
                        </div>
                    )) : <p className="text-sm text-center text-slate-500 py-8">No past prescriptions found.</p>) : <Placeholder text="Patient's prescription history will appear here." />}
                </div>
            </div>

            {isFormOpen && <PrescriptionFormModal {...{searchedCustomer, handleSubmit, onSubmit, fields, register, remove, append, loading, setIsFormOpen}} />}

            <button onClick={openForm} disabled={!searchedCustomer} title={!searchedCustomer ? "Search for a patient to enable" : "Create New Prescription"} className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-100">
                <Plus size={24} />
            </button>
        </DoctorDashboardLayout>
    );
}

// Helper Components
const PrescriptionFormModal = ({ searchedCustomer, handleSubmit, onSubmit, fields, register, remove, append, loading, setIsFormOpen }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xl relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-1">New Prescription For:</h3>
                <div className="flex items-baseline gap-2">
                    <p className="font-bold text-emerald-700 text-xl">{searchedCustomer.name}</p>
                    <p className="text-sm text-slate-500 font-mono">(Med ID: {searchedCustomer.med_id})</p>
                </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <MedicineFields {...{ fields, register, remove, append }} />
                <TextAreaField label="Additional Notes" name="notes" register={register} rows="3" />
                <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center justify-center">
                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <FilePlus className="mr-2" size={16} />}
                    {loading ? 'Creating...' : 'Create Prescription'}
                </button>
            </form>
        </div>
    </div>
);

const MedicineFields = ({ fields, register, remove, append }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Medicines</label>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg border">
                    <div className="col-span-11 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input {...register(`medicines.${index}.name`)} placeholder="Medicine Name" className="input-field" required />
                        <input {...register(`medicines.${index}.dosage`)} placeholder="Dosage (e.g., 500mg)" className="input-field" required />
                        <input {...register(`medicines.${index}.instructions`)} placeholder="Instructions" className="input-field" required />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                        <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                    </div>
                </div>
            ))}
        </div>
        <button type="button" onClick={() => append({ name: '', dosage: '', instructions: '' })} className="mt-3 text-sm flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-800">
            <Plus size={16} /> Add Medicine
        </button>
    </div>
);

const TextAreaField = ({ label, name, register, ...rest }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea {...register(name)} {...rest} className="input-field" />
    </div>
);

const Placeholder = ({ text }) => (
    <div className="text-center py-20 text-slate-400"><Search size={40} className="mx-auto mb-3" /><p>{text}</p></div>
);

const styles = `.input-field{width:100%;padding:8px 12px;font-size:14px;border:1px solid #cbd5e1;border-radius:8px;transition:box-shadow .2s}.input-field:focus{outline:0;box-shadow:0 0 0 2px rgba(16,185,129,.5);border-color:#10b981}`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


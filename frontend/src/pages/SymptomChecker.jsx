import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Bot, Stethoscope, Loader2, HeartPulse } from 'lucide-react';
import DashboardLayout from '/src/components/DashboardLayout.jsx';
import { getCustomerProfile, getAllDoctors } from '/src/services/api.js';
import { symptomData, allSymptoms } from '/src/data/symptomData.js';

export default function SymptomChecker() {
    const [userProfile, setUserProfile] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [profileRes, doctorsRes] = await Promise.all([getCustomerProfile(), getAllDoctors()]);
                setUserProfile(profileRes.data);
                setDoctors(doctorsRes.data);
            } catch (err) {
                if (err.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleSelectSymptom = (symptom) => {
        if (!selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms([...selectedSymptoms, symptom]);
        }
        setSearchTerm('');
    };

    const handleRemoveSymptom = (symptom) => {
        setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    };

    const handlePredict = () => {
        if (selectedSymptoms.length === 0) return;

        const diseaseCounts = {};
        selectedSymptoms.forEach(symptom => {
            const { disease } = symptomData[symptom];
            diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
        });

        const predictedDisease = Object.keys(diseaseCounts).reduce((a, b) => diseaseCounts[a] > diseaseCounts[b] ? a : b);
        const mainSpecialization = symptomData[selectedSymptoms[0]].specialization;

        const recommendedDocs = doctors.filter(doc => doc.specialization === mainSpecialization);

        setResults({
            disease: predictedDisease,
            specialization: mainSpecialization,
            doctors: recommendedDocs,
        });
    };

    const filteredSymptoms = useMemo(() => {
        if (!searchTerm) return [];
        return allSymptoms.filter(symptom =>
            symptom.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedSymptoms.includes(symptom)
        ).slice(0, 5);
    }, [searchTerm, selectedSymptoms]);

    if (loading) {
        return <div className="w-screen h-screen flex justify-center items-center"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;
    }
    
    return (
        <DashboardLayout activeItem="symptom-checker" userProfile={userProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    Symptom Checker <span className="text-xs bg-sky-100 text-sky-700 font-bold py-1 px-3 rounded-full">Beta</span>
                </h1>
                <p className="text-slate-500 mt-1">Describe your symptoms to get a preliminary diagnosis and find a specialist.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Search for your symptoms</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="e.g., Headache, Fever..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        {filteredSymptoms.length > 0 && (
                            <div className="mt-2 bg-slate-50 border rounded-lg">
                                {filteredSymptoms.map(symptom => (
                                    <div key={symptom} onClick={() => handleSelectSymptom(symptom)} className="px-4 py-2 text-sm text-slate-700 cursor-pointer hover:bg-emerald-100">
                                        {symptom}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-slate-800 mb-3">Selected Symptoms</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedSymptoms.map(symptom => (
                                <div key={symptom} className="flex items-center gap-2 bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
                                    {symptom}
                                    <button onClick={() => handleRemoveSymptom(symptom)} className="text-emerald-600 hover:text-emerald-900"><X size={14} /></button>
                                </div>
                            ))}
                            {selectedSymptoms.length === 0 && <p className="text-sm text-slate-400">No symptoms selected.</p>}
                        </div>
                    </div>
                    
                    <button onClick={handlePredict} disabled={selectedSymptoms.length === 0} className="w-full py-3 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Bot size={18} /> Predict Disease
                    </button>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border">
                    {results ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Preliminary Diagnosis</h3>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">{results.disease}</p>
                                <p className="text-sm text-slate-500 mt-2">Based on your symptoms, you might be experiencing a {results.disease}. Please note, this is not a medical diagnosis. Consult with a doctor for an accurate assessment.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recommended Specialists ({results.specialization})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.doctors.length > 0 ? results.doctors.map(doc => (
                                        <DoctorCard key={doc._id} doctor={doc} />
                                    )) : <p className="text-sm text-slate-500">No doctors found for this specialization.</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                             <HeartPulse size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700">Your Results Will Appear Here</h3>
                            <p className="max-w-xs mt-1 text-sm">Add your symptoms and click "Predict Disease" to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

const DoctorCard = ({ doctor }) => (
  <div className="bg-slate-50 p-4 rounded-lg border flex items-center justify-between gap-4">
    <div className="flex items-center gap-4">
        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${doctor.name}`} alt={doctor.name} className="w-12 h-12 rounded-full" />
        <div>
            <h4 className="font-bold text-slate-800">Dr. {doctor.name}</h4>
            <p className="text-xs text-emerald-700 font-medium">{doctor.specialization}</p>
        </div>
    </div>
    <Link to="/customer/appointments" className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-md transition-colors">
        Book Now
    </Link>
  </div>
);


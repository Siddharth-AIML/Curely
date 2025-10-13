import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Bot, Loader2, HeartPulse, AlertTriangle } from 'lucide-react';
import DashboardLayout from '/src/components/DashboardLayout.jsx';
import { getCustomerProfile, getAllDoctors } from '/src/services/api.js';
import Questionnaire from '/src/components/Questionnaire.jsx';

// --- Placeholder Imports for BBN Components (Ensure these are correct) ---
// You MUST import these components from their actual paths:
// import Questionnaire from '/src/components/Questionnaire.jsx';
// import DoctorFinder from '/src/components/DoctorFinder.jsx'; 

// Placeholder data since original imports are unavailable. We need a symptom list.
const allSymptoms = ["fever", "cough", "headache", "joint pain", "sore throat", "fatigue", "nausea", "vomiting", "chest pain"]; 

// --- URGENCY THRESHOLD (50%) ---
const URGENCY_THRESHOLD = 0.50;

// --- DYNAMIC STATE MAPPING FOR FLOW ---
const FLOW_STEPS = {
    SELECT: 'select', 
    QUESTIONS: 'questions',
    RESULTS: 'results', 
    URGENT_DOCTOR: 'urgent_doctor' 
};

// Local DoctorCard definition (as it was in your original file)
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


export default function SymptomChecker() {
    const [userProfile, setUserProfile] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- BBN FLOW STATES ---
    const [currentFlowStep, setCurrentFlowStep] = useState(FLOW_STEPS.SELECT);
    const [questions, setQuestions] = useState({}); 
    const [allAnswers, setAllAnswers] = useState({}); 
    const [currentPrediction, setCurrentPrediction] = useState(null); 
    const [isPredicting, setIsPredicting] = useState(false);
    const [apiError, setApiError] = useState(null);
    
    // NOTE: Geolocation state is typically handled in App.jsx or a central provider. 
    // For simplicity, we are omitting explicit geolocation requests here, but the DoctorFinder will need this data.

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

    // --- SYMPTOM SELECTION LOGIC (Unchanged) ---
    const handleSelectSymptom = (symptom) => {
        if (!selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms([...selectedSymptoms, symptom]);
        }
        setSearchTerm('');
        setCurrentFlowStep(FLOW_STEPS.SELECT); 
    };

    const handleRemoveSymptom = (symptom) => {
        setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
        setCurrentFlowStep(FLOW_STEPS.SELECT);
    };

    const filteredSymptoms = useMemo(() => {
        if (!searchTerm) return [];
        return allSymptoms.filter(symptom =>
            symptom.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedSymptoms.includes(symptom)
        ).slice(0, 5);
    }, [searchTerm, selectedSymptoms]);


    // --- 2. BBN FLOW INITIATION ---
    const handleInitiateQuestionnaire = async () => {
        if (selectedSymptoms.length === 0) return;
        setIsPredicting(true);
        setApiError(null);

        try {
            // FIX: Use the /bbn-api/ proxy path for the Python server
            const res = await fetch("/bbn-api/questions", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symptoms: selectedSymptoms }), 
            });

            if (!res.ok) throw new Error("Backend connection failed or returned error.");
            
            const data = await res.json();
            setIsPredicting(false);

            if (data.questions && Object.keys(data.questions).length > 0) {
                setQuestions(data.questions);
                setAllAnswers({}); 
                setCurrentFlowStep(FLOW_STEPS.QUESTIONS); 
            } else {
                handleFinalPrediction({});
            }
        } catch (err) {
            console.error("Question fetch error:", err);
            setIsPredicting(false);
            setApiError("Could not connect to the BBN service. Check console/vite.config.js for proxy errors.");
        }
    };
    
    // --- 3. QUESTIONNAIRE ANSWER FLOW (Logic depends on Questionnaire component) ---
    const handleQuestionSubmit = (symptom, question, value) => {
        const newAnswers = {
            ...allAnswers,
            [symptom]: { ...allAnswers[symptom], [question]: value, },
        };
        setAllAnswers(newAnswers);

        const allSymptomKeys = Object.keys(questions);
        let allQuestionsAnswered = true;

        for (const s of allSymptomKeys) {
            const questionsForSymptom = questions[s];
            const answeredCount = newAnswers[s] ? Object.keys(newAnswers[s]).length : 0;
            if (answeredCount < questionsForSymptom.length) {
                allQuestionsAnswered = false;
                break;
            }
        }
        
        if (allQuestionsAnswered) {
            handleFinalPrediction(newAnswers);
        } 
    };

    // --- 4. FINAL PREDICTION CALL ---
    const handleFinalPrediction = async (finalAnswers) => {
        setIsPredicting(true);
        setApiError(null);

        const formattedRatings = {};
        for (const symptom in finalAnswers) {
            const values = Object.values(finalAnswers[symptom]).map((v) => Number(v));
            formattedRatings[symptom] = values.reduce((a, b) => a + b, 0) / values.length || 0;
        }

        try {
            // FIX: Use the /bbn-api/ proxy path for prediction
            const res = await fetch("/bbn-api/predict", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symptom_ratings: formattedRatings }),
            });

            if (!res.ok) throw new Error("Prediction API call failed.");
            
            const data = await res.json();
            setIsPredicting(false);

            const topResults = data.top_3_diseases || [];
            
            // Urgency threshold check: probability is usually stored in index [1] of the array result
            const topProbability = topResults.length > 0 ? (topResults[0].probability || topResults[0][1]) : 0;
            
            if (topProbability >= URGENCY_THRESHOLD) {
                 setCurrentPrediction({ 
                     disease: topResults[0].disease || topResults[0][0],
                     probability: topProbability 
                 });
                 // If threshold met, switch to urgent doctor view
                 setCurrentFlowStep(FLOW_STEPS.URGENT_DOCTOR);
            } else {
                 // Normal results flow
                 setCurrentPrediction({ results: topResults });
                 setCurrentFlowStep(FLOW_STEPS.RESULTS);
            }

        } catch (err) {
            console.error("Prediction error:", err);
            setIsPredicting(false);
            setApiError("Error running prediction. Check if the BBN server is running.");
        }
    };
    
    // --- 5. RENDER LOGIC ---

    const renderMainContent = () => {
        // --- API Error State ---
        if (apiError) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-8">
                     <AlertTriangle size={48} className="mb-4" />
                     <h3 className="text-xl font-semibold text-red-700">BBN Service Error</h3>
                     <p className="mt-2 max-w-sm">{apiError}</p>
                     <p className="text-xs mt-1">Ensure your Python Flask Server is running on **http://127.0.0.1:5000**.</p>
                     <button onClick={() => setCurrentFlowStep(FLOW_STEPS.SELECT)} className="mt-4 text-sm font-medium text-blue-600 hover:underline">Go Back to Selection</button>
                </div>
             );
        }
        
        if (currentFlowStep === FLOW_STEPS.QUESTIONS) {
            // Placeholder structure for Questionnaire
            // Inside renderMainContent, where currentFlowStep === FLOW_STEPS.QUESTIONS:
return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border h-full">
        <h3 className="text-xl font-bold text-slate-800">Symptom Severity Assessment</h3>
        <p className="text-slate-500 mb-4">Please answer the questions below to finalize your assessment.</p>
        
        <Questionnaire 
            questions={questions} 
            allAnswers={allAnswers} 
            onSubmit={handleQuestionSubmit} 
            onFinish={handleFinalPrediction} // Pass the function to trigger prediction when done
        />
    </div>
);
        }

        if (currentFlowStep === FLOW_STEPS.URGENT_DOCTOR) {
            // Placeholder structure for DoctorFinder
            return (
                <div className="bg-red-50 p-6 rounded-2xl shadow-lg border-red-300 h-full">
                    <div className="flex items-center gap-2 text-red-700 mb-4">
                        <AlertTriangle size={24} />
                        <h3 className="text-xl font-bold">URGENT: High Risk Detected</h3>
                    </div>
                    <p className="text-sm text-red-600">
                        Highest predicted risk: **{currentPrediction.disease}** at **{(currentPrediction.probability * 100).toFixed(1)}%**. 
                        Please seek immediate consultation.
                    </p>
                    {/* You MUST replace this with your DoctorFinder component, passing props: */}
                    {/* <DoctorFinder highestRiskDisease={currentPrediction.disease} doctors={doctors} /> */}
                    <div className="py-4 text-center text-red-400">
                        Doctor Finder UI Here
                    </div>
                    <button onClick={() => setCurrentFlowStep(FLOW_STEPS.SELECT)} className="mt-4 w-full text-sm font-medium text-blue-600 hover:underline">Go Back to Selection</button>
                </div>
            );
        }


        // --- Normal Results Flow ---
        if (currentFlowStep === FLOW_STEPS.RESULTS) {
            const topResult = currentPrediction.results[0];
            // You'll need to filter doctors based on specialization provided by the BBN response or a local mapping
            const recommendedDocs = doctors.filter(doc => doc.specialization === topResult.specialization); 

            return (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Preliminary Diagnosis</h3>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{topResult.disease || 'Unknown'}</p>
                        <p className="text-sm text-slate-500 mt-2">Probability: {(topResult.probability * 100).toFixed(1)}%</p>
                        <p className="mt-3 text-sm text-slate-500">Based on your assessment, your symptoms most closely align with {topResult.disease}. This is not a formal diagnosis.</p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recommended Specialists</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendedDocs.length > 0 ? recommendedDocs.map(doc => (
                                <DoctorCard key={doc._id} doctor={doc} />
                            )) : <p className="text-sm text-slate-500">No matching specialists found in the database.</p>}
                        </div>
                    </div>
                    <button onClick={() => setCurrentFlowStep(FLOW_STEPS.SELECT)} className="mt-4 text-sm font-medium text-blue-600 hover:underline">Start New Assessment</button>
                </div>
            );
        }

        // Default case: FLOW_STEPS.SELECT (Symptom Selection UI Placeholder)
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                 <HeartPulse size={48} className="text-slate-300 mb-4" />
                 <h3 className="text-lg font-semibold text-slate-700">Start Your Assessment</h3>
                 <p className="max-w-xs mt-1 text-sm">Use the search bar on the left to add your symptoms and click "Start Assessment".</p>
            </div>
        );
    };

    return (
        <DashboardLayout activeItem="symptom-checker" userProfile={userProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    Symptom Checker <span className="text-xs bg-sky-100 text-sky-700 font-bold py-1 px-3 rounded-full">Beta</span>
                </h1>
                <p className="text-slate-500 mt-1">Describe your symptoms to get a preliminary diagnosis and find a specialist.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {/* Left Column: Symptom Selection */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border space-y-6 self-start">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Search for your symptoms</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="e.g., Headache, Fever..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg"
                                disabled={currentFlowStep !== FLOW_STEPS.SELECT}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        {filteredSymptoms.length > 0 && (
                            <div className="mt-2 bg-slate-50 border rounded-lg max-h-40 overflow-y-auto absolute z-10 w-[90%] lg:w-[calc(33%-16px)]">
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
                        <div className="flex flex-wrap gap-2 min-h-[40px]">
                            {selectedSymptoms.map(symptom => (
                                <div key={symptom} className="flex items-center gap-2 bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
                                    {symptom}
                                    <button onClick={() => handleRemoveSymptom(symptom)} className="text-emerald-600 hover:text-emerald-900"><X size={14} /></button>
                                </div>
                            ))}
                            {selectedSymptoms.length === 0 && <p className="text-sm text-slate-400">No symptoms selected.</p>}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleInitiateQuestionnaire} 
                        disabled={selectedSymptoms.length === 0 || isPredicting || currentFlowStep !== FLOW_STEPS.SELECT} 
                        className="w-full py-3 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-150"
                    >
                        {isPredicting ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />} 
                        {isPredicting ? 'Analyzing...' : 'Start Assessment'}
                    </button>
                </div>

                {/* Right Column: Prediction/Questionnaire/Results */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border min-h-[500px]">
                    {renderMainContent()}
                </div>
            </div>
            {/* Disclaimer for medical advice */}
            <p className="text-center text-xs text-red-500 mt-4 italic">Disclaimer: This symptom checker is for informational purposes only and is not a substitute for professional medical advice.</p>
        </DashboardLayout>
    );
}


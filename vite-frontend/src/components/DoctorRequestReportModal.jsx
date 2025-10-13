import React, { useState, useEffect } from 'react';
import { Search, FlaskConical, CornerUpRight, Loader2, X, CheckCircle } from 'lucide-react';
// Assuming /src/services/api.js location and import names
import { requestLabTest, findCustomerByMedId, getApprovedLabs } from '../services/api'; 

export default function DoctorRequestReportModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [patientMedId, setPatientMedId] = useState('');
    const [patientDetails, setPatientDetails] = useState(null); // Stores patient's MongoDB ID, name, etc.
    const [labs, setLabs] = useState([]); // Stores list of approved labs
    const [formData, setFormData] = useState({
        assignedLabId: '', // MongoDB ID of the selected lab
        testName: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // --- Data Fetching: Labs ---
    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const response = await getApprovedLabs(); 
                const approvedLabs = response.data; // Assuming response.data is the array of labs
                setLabs(approvedLabs);
                if (approvedLabs.length > 0) {
                    setFormData(prev => ({ ...prev, assignedLabId: approvedLabs[0]._id }));
                }
            } catch (err) {
                console.error("Failed to fetch approved labs:", err);
                setError("Could not load list of labs.");
            }
        };
        fetchLabs();
    }, []);

    // --- Search Patient by MedID ---
    const handlePatientSearch = async () => {
        if (!patientMedId) return;
        setError(null);
        setSearchLoading(true);
        setPatientDetails(null);
        try {
            // This calls the Doctor utility route: GET /api/doctor/customer/:medId
            const { data } = await findCustomerByMedId(patientMedId); 
            // The response data should be the patient's document: { _id, name, med_id, age, ... }
            setPatientDetails(data);
        } catch (err) {
            console.error("Patient search error:", err);
            setError("Patient not found. Check Medical ID.");
            setPatientDetails(null);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Submit Test Request ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!patientDetails || !patientDetails.med_id) {
            setError("Please search and confirm the patient before requesting a test.");
            return;
        }
        if (!formData.assignedLabId || !formData.testName) {
            setError("Lab and Test Name are required.");
            return;
        }

        setLoading(true);

        const payload = {
            patientMedId: patientDetails.med_id, // Pass MedID for backend lookup
            assignedLabId: formData.assignedLabId,
            testName: formData.testName,
            notes: formData.notes
        };

        try {
            await requestLabTest(payload); // Calls POST /api/reports/request
            setSuccess(`Request for ${formData.testName} sent to lab successfully!`);
            
            // Clear the form after a short delay
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error("Request submission error:", err);
            setError(err.response?.data?.msg || "Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
                
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <FlaskConical className="w-6 h-6 mr-2 text-teal-600" /> New Lab Test Request
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Status Messages */}
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg flex items-center">
                            <X className="w-4 h-4 mr-2" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" /> {success}
                        </div>
                    )}

                    {/* Patient Search */}
                    <div className="border p-4 rounded-lg bg-slate-50">
                        <h4 className="font-semibold text-slate-700 mb-3">1. Patient Identification</h4>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Patient Medical ID (e.g., 543210)"
                                value={patientMedId}
                                onChange={e => setPatientMedId(e.target.value)}
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-teal-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={handlePatientSearch}
                                disabled={searchLoading}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center"
                            >
                                {searchLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5 mr-1" />}
                                Search
                            </button>
                        </div>
                        
                        {patientDetails && (
                            <div className="mt-3 text-sm text-slate-600 p-3 bg-white border rounded-lg">
                                <p className="font-semibold">Patient: {patientDetails.name}</p>
                                <p>Age: {patientDetails.age || 'N/A'} | ID: {patientDetails.med_id}</p>
                            </div>
                        )}
                        {/* Show error if search failed */}
                        {!patientDetails && error && patientMedId && !searchLoading && (
                            <div className="mt-3 text-sm text-red-500">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Request Details */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700">2. Request Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Lab</label>
                                <select
                                    name="assignedLabId"
                                    value={formData.assignedLabId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-teal-500"
                                    required
                                    disabled={labs.length === 0}
                                >
                                    {labs.length === 0 ? (
                                        <option value="">No Labs Found</option>
                                    ) : (
                                        labs.map(lab => (
                                            <option key={lab._id} value={lab._id}>{lab.name}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                                <input
                                    type="text"
                                    name="testName"
                                    value={formData.testName}
                                    onChange={handleChange}
                                    placeholder="e.g., CBC, Vitamin D"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-teal-500"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Relevant symptoms or urgency notes for the lab."
                                rows="3"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t">
                        <button
                            type="submit"
                            disabled={loading || !patientDetails || success || labs.length === 0}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white font-semibold shadow-lg hover:bg-teal-700 transition-all disabled:opacity-50"
                        >
                            <CornerUpRight className="w-5 h-5" />
                            {loading ? 'Sending Request...' : 'Send Test Request to Lab'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
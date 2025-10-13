import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// Corrected component import path
import LabDashboardLayout from '/src/components/LabDashboardLayout.jsx';
// Corrected API import path
import { getTestDetails, uploadTestReport } from '/src/services/api.js';
import { FileUp, Loader2, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
};

export default function LabReportUpload() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [testDetails, setTestDetails] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // 1. Fetch Test Details
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                // Ensure getTestDetails exists in your API
                const { data } = await getTestDetails(reportId); 
                setTestDetails(data);
                
                // Check if test is already completed
                if (data.status === 'Completed') {
                    setError('This report has already been uploaded and marked complete.');
                    setSuccess(true);
                }

            } catch (err) {
                console.error("Error fetching test details:", err);
                setError('Failed to load test details. Check if the ID is valid.');
            } finally {
                setLoading(false);
            }
        };

        if (reportId) {
            fetchDetails();
        }
    }, [reportId]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setError('Please select a valid PDF file for the report.');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!file) {
            setError('No file selected.');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('reportFile', file); // 'reportFile' must match the key used in your multer middleware
            
            // Ensure uploadTestReport exists in your API
            await uploadTestReport(reportId, formData);
            
            setSuccess(true);
            
            // Wait briefly before redirecting back to the dashboard
            setTimeout(() => {
                navigate('/dashboard/lab');
            }, 2000);

        } catch (err) {
            console.error("Report Upload Error:", err);
            setError(err.response?.data?.msg || 'File upload failed. Please try again.');
            setSuccess(false);
        } finally {
            setUploading(false);
        }
    };

    // --- Render Logic ---

    if (loading) {
        return (
            <LabDashboardLayout>
                <div className="flex items-center justify-center p-10 text-teal-600">
                    <Loader2 className="w-8 h-8 animate-spin mr-3" />
                    <p className="text-xl font-medium">Loading test request details...</p>
                </div>
            </LabDashboardLayout>
        );
    }
    
    // Test for unrecoverable errors (e.g., ID not found)
    if (error && !testDetails) {
        return (
            <LabDashboardLayout>
                <div className="text-center p-10">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-700">Error</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <Link to="/dashboard/lab" className="mt-6 inline-flex items-center text-teal-600 hover:text-teal-800 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Link>
                </div>
            </LabDashboardLayout>
        );
    }

    return (
        <LabDashboardLayout>
            <div className="flex items-center mb-6">
                <button 
                    onClick={() => navigate('/dashboard/lab')}
                    className="p-2 mr-4 text-gray-600 hover:bg-gray-100 rounded-full transition"
                    title="Back to Dashboard"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Upload Test Report</h1>
            </div>

            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-2xl space-y-6">
                
                {/* Test Information */}
                <div className="border-b pb-4 mb-4">
                    <p className="text-lg font-semibold text-gray-700">{testDetails?.testName} for Patient:</p>
                    <h2 className="text-2xl font-extrabold text-teal-700">
                        {testDetails?.patient?.name} (Med ID: {testDetails?.patient?.med_id})
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Requested by Dr. {testDetails?.doctor?.name} on {formatDate(testDetails?.requestedAt)}
                    </p>
                    {testDetails?.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic border-l-2 pl-2 border-teal-300">
                            Doctor Notes: {testDetails.notes}
                        </p>
                    )}
                </div>

                {/* Status Messages */}
                {success && (
                    <div className="flex items-center p-4 bg-green-100 text-green-700 rounded-lg font-medium">
                        <CheckCircle className="w-5 h-5 mr-3" />
                        Upload successful! Redirecting to dashboard...
                    </div>
                )}

                {error && (
                    <div className="flex items-center p-4 bg-red-100 text-red-700 rounded-lg font-medium">
                        <XCircle className="w-5 h-5 mr-3" />
                        {error}
                    </div>
                )}
                
                {/* Upload Form */}
                {testDetails?.status !== 'Completed' && (
                    <form className="space-y-6" onSubmit={handleUpload}>
                        <label className="block text-sm font-medium text-gray-700">
                            Select Final Report File (PDF only)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-teal-500 transition duration-150">
                            <div className="space-y-1 text-center">
                                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                                    >
                                        <span>Upload a file</span>
                                        <input 
                                            id="file-upload" 
                                            name="file-upload" 
                                            type="file" 
                                            accept="application/pdf" 
                                            className="sr-only" 
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {file ? file.name : 'PDF up to 10MB'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || uploading || success}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition duration-150 ease-in-out"
                        >
                            {uploading ? (
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            ) : (
                                <FileUp className="w-5 h-5 mr-2" />
                            )}
                            {uploading ? 'Uploading Report...' : 'Finalize and Upload Report'}
                        </button>
                    </form>
                )}
            </div>
        </LabDashboardLayout>
    );
}
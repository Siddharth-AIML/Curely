import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Corrected component import path
import LabDashboardLayout from '/src/components/LabDashboardLayout.jsx'; 
// Corrected API import path
import { getLabPendingTests, updateTestStatus } from '/src/services/api.js'; 
import { Clock, CheckCircle, Upload, Loader2, RefreshCw } from 'lucide-react';

// Helper function to format the date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
};

// Helper function to determine badge styling based on status
const getStatusBadge = (status) => {
    switch (status) {
        case 'Requested':
            return <span className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">Requested</span>;
        case 'In Progress':
            return <span className="px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">In Progress</span>;
        case 'Completed':
            return <span className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">Completed</span>;
        case 'Canceled':
            return <span className="px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full">Canceled</span>;
        default:
            return <span className="px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
};

export default function LabDashboard() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusLoading, setStatusLoading] = useState({}); // State to track status update loading for specific tests

    // Function to fetch all pending tests for this lab
    const fetchPendingTests = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await getLabPendingTests();
            setTests(data);
        } catch (err) {
            console.error("Error fetching lab tests:", err);
            setError('Failed to fetch pending test requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTests();
    }, []);

    // Function to handle updating the test status
    const handleStatusUpdate = async (id, newStatus) => {
        setStatusLoading(prev => ({ ...prev, [id]: true }));
        try {
            await updateTestStatus(id, newStatus);
            // Refresh the list after successful update
            await fetchPendingTests(); 
        } catch (err) {
            console.error("Error updating status:", err);
            // Show a temporary error message
            alert(`Failed to update status: ${err.response?.data?.msg || 'Server error'}`);
        } finally {
            setStatusLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const pendingCount = tests.filter(t => t.status === 'Requested').length;
    const inProgressCount = tests.filter(t => t.status === 'In Progress').length;
    
    // --- Render Logic ---

    if (loading) {
        return (
            <LabDashboardLayout>
                <div className="flex items-center justify-center p-10 text-teal-600">
                    <Loader2 className="w-8 h-8 animate-spin mr-3" />
                    <p className="text-xl font-medium">Loading pending test requests...</p>
                </div>
            </LabDashboardLayout>
        );
    }

    return (
        <LabDashboardLayout>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Lab Dashboard Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                        <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">{pendingCount}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">In Progress Tests</p>
                        <RefreshCw className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">{inProgressCount}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Total Assigned Tests</p>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">{tests.length}</p>
                </div>
            </div>

            {/* Test Requests Table */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Current Test Queue</h2>
                
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 font-medium">{error}</div>
                )}
                
                {tests.length === 0 ? (
                    <p className="text-gray-500 text-lg py-8 text-center">
                        🎉 Great job! You currently have no pending test requests.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tests.map((test) => (
                                    <tr key={test._id} className="hover:bg-gray-50 transition duration-100">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-600">{test.testName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{test.patient.med_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{test.doctor.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(test.requestedAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(test.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                                                {test.status === 'Requested' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(test._id, 'In Progress')}
                                                        disabled={statusLoading[test._id]}
                                                        className="px-3 py-1 text-xs font-semibold rounded-md bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 transition"
                                                    >
                                                        {statusLoading[test._id] ? 'Updating...' : 'Start Test'}
                                                    </button>
                                                )}
                                                
                                                {test.status === 'In Progress' && (
                                                    <Link
                                                        to={`/lab/reports/upload/${test._id}`}
                                                        className="px-3 py-1 text-xs font-semibold rounded-md bg-teal-600 text-white hover:bg-teal-700 flex items-center justify-center transition"
                                                    >
                                                        <Upload className="w-3 h-3 mr-1" />
                                                        Upload Report
                                                    </Link>
                                                )}

                                                {/* Option to view details */}
                                                <Link
                                                    to={`/reports/lab`} // Redirect to the detailed reports queue
                                                    className="px-3 py-1 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition flex items-center justify-center"
                                                >
                                                    Details
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </LabDashboardLayout>
    );
}
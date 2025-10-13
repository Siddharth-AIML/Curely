import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Corrected component import path
import LabDashboardLayout from '/src/components/LabDashboardLayout.jsx';
// Corrected API import path
import { getLabPendingTests } from '/src/services/api.js'; 
import { FileText, Loader2, ArrowRight } from 'lucide-react';

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'Requested':
            return <span className="px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded">Requested</span>;
        case 'In Progress':
            return <span className="px-2 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">In Progress</span>;
        case 'Completed':
            return <span className="px-2 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded">Completed</span>;
        default:
            return <span className="px-2 py-0.5 text-xs font-medium text-gray-800 bg-gray-100 rounded">{status}</span>;
    }
};

export default function LabReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all reports (pending, in progress, completed) assigned to the lab
    const fetchAllReports = async () => {
        setLoading(true);
        setError(null);
        try {
            // Note: getLabPendingTests should probably be renamed in API to getLabAssignedTests
            // if it returns ALL tests, not just pending ones. I'm assuming it returns ALL.
            const { data } = await getLabPendingTests(); 
            setReports(data);
        } catch (err) {
            console.error("Error fetching lab reports:", err);
            setError('Failed to fetch the list of reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReports();
    }, []);

    if (loading) {
        return (
            <LabDashboardLayout>
                <div className="flex items-center justify-center p-10 text-teal-600">
                    <Loader2 className="w-8 h-8 animate-spin mr-3" />
                    <p className="text-xl font-medium">Loading assigned reports...</p>
                </div>
            </LabDashboardLayout>
        );
    }

    return (
        <LabDashboardLayout>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <FileText className="w-7 h-7 mr-3" /> All Assigned Test Reports
            </h1>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 font-medium">{error}</div>
            )}
            
            {reports.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-xl font-medium">No test reports have been assigned to your laboratory yet.</p>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test ID / Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested On</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reports.map((report) => (
                                <tr key={report._id} className="hover:bg-gray-50 transition duration-100">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-semibold text-teal-600">{report.testName}</p>
                                        <p className="text-xs text-gray-500">{report._id}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.patient.med_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(report.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(report.requestedAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {report.status === 'Completed' ? (
                                            <button 
                                                onClick={() => alert(`View/Download Report for ${report._id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                            >
                                                View Report
                                            </button>
                                        ) : (
                                            <Link
                                                to={`/lab/reports/upload/${report._id}`}
                                                className="text-teal-600 hover:text-teal-900 flex items-center font-medium"
                                            >
                                                Process Test <ArrowRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </LabDashboardLayout>
    );
}
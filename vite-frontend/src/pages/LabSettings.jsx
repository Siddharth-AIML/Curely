import React, { useState, useEffect } from 'react';
// Corrected component import path
import LabDashboardLayout from '/src/components/LabDashboardLayout.jsx';
// Corrected API import path
import { getLabProfile, updateLabProfile } from '/src/services/api.js';
import { Settings, Loader2, Save, XCircle, CheckCircle } from 'lucide-react';

export default function LabSettings() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        labId: '',
        isApproved: false,
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch Lab Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Ensure getLabProfile exists in your API
                const { data } = await getLabProfile();
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    labId: data.labId || '',
                    
                });
            } catch (err) {
                console.error("Error fetching lab profile:", err);
                setError('Failed to fetch profile data. Please ensure you are logged in.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setSuccess(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        setSuccess(null);

        // Only send fields that can be updated
        const updateData = {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
        };

        try {
            // Ensure updateLabProfile exists in your API
            await updateLabProfile(updateData);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.msg || 'Profile update failed. Check your inputs.');
        } finally {
            setUpdating(false);
        }
    };

    // --- Render Logic ---

    if (loading) {
        return (
            <LabDashboardLayout>
                <div className="flex items-center justify-center p-10 text-teal-600">
                    <Loader2 className="w-8 h-8 animate-spin mr-3" />
                    <p className="text-xl font-medium">Loading settings...</p>
                </div>
            </LabDashboardLayout>
        );
    }

    return (
        <LabDashboardLayout>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <Settings className="w-7 h-7 mr-3" /> Lab Account Settings
            </h1>

            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl space-y-8">
                
               

                {/* Profile Update Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Lab Details</h2>

                    {/* Notification Alerts */}
                    {success && (
                        <div className="flex items-center p-3 bg-green-100 text-green-700 rounded-lg font-medium">
                            <CheckCircle className="w-5 h-5 mr-3" />
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center p-3 bg-red-100 text-red-700 rounded-lg font-medium">
                            <XCircle className="w-5 h-5 mr-3" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Laboratory Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        {/* Lab ID (Read-only) */}
                        <div>
                            <label htmlFor="labId" className="block text-sm font-medium text-gray-700">Unique Lab ID</label>
                            <input
                                id="labId"
                                name="labId"
                                type="text"
                                value={formData.labId}
                                readOnly
                                className="mt-1 block w-full border border-gray-200 rounded-md shadow-inner p-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                readOnly
                                className="mt-1 block w-full border border-gray-200 rounded-md shadow-inner p-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        
                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>
                    
                    {/* Address (Full Width) */}
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Full Address</label>
                        <textarea
                            id="address"
                            name="address"
                            rows="3"
                            value={formData.address}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                    
                    {/* Save Button */}
                    <div className="pt-5">
                        <button
                            type="submit"
                            disabled={updating}
                            className="w-full md:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition duration-150 ease-in-out shadow-lg"
                        >
                            {updating ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </LabDashboardLayout>
    );
}
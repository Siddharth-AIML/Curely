import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ShieldCheck, User, AtSign, Loader2 } from 'lucide-react';
import DashboardLayout from '/src/components/DashboardLayout.jsx';
import { getCustomerProfile, updateCustomerPassword } from '/src/services/api.js';

export default function CustomerSettings() {
    const [userProfile, setUserProfile] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
    const newPassword = watch("newPassword");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getCustomerProfile();
                setUserProfile(res.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };
        fetchProfile();
    }, []);
    
    const onPasswordSubmit = async (data) => {
        setMessage('');
        setError('');
        try {
            const res = await updateCustomerPassword(data);
            setMessage(res.data.msg);
            reset();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred.');
        }
    };

    return (
        <DashboardLayout activeItem="settings" userProfile={userProfile}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
                <p className="text-slate-500 mt-1">Manage your account details and security.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Information */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Profile Information</h3>
                    {userProfile ? (
                        <div className="space-y-4 text-sm">
                            <InfoRow icon={<User size={16} />} label="Name" value={userProfile.name} />
                            <InfoRow icon={<AtSign size={16} />} label="Email" value={userProfile.email} />
                            <InfoRow icon={<ShieldCheck size={16} />} label="Medical ID" value={userProfile.med_id} />
                        </div>
                    ) : (
                        <Loader2 className="animate-spin text-emerald-600" />
                    )}
                </div>

                {/* Change Password */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h3>
                    <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <InputField label="Current Password" type="password" name="currentPassword" register={register} errors={errors} required />
                        <InputField label="New Password" type="password" name="newPassword" register={register} errors={errors} required minLength={6} />
                        <InputField label="Confirm New Password" type="password" name="confirmPassword" register={register} errors={errors} required validate={value => value === newPassword || "Passwords do not match"} />
                        
                        {message && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">{message}</p>}
                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                        <div className="pt-2">
                            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700">Update Password</button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

const InfoRow = ({ icon, label, value }) => (<div className="flex items-center text-slate-600"><span className="text-slate-400">{icon}</span><span className="ml-3 font-medium w-24">{label}:</span><span className="font-semibold text-slate-800">{value}</span></div>);
const InputField = ({ label, type, name, register, errors, ...rest }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input type={type} {...register(name, { ...rest })} className={`w-full px-4 py-2 text-sm border rounded-lg ${errors[name] ? 'border-red-500' : 'border-slate-300'}`} />
        {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name].message}</p>}
    </div>
);

import React from "react";
import { HeartPulse, Clock } from 'lucide-react';

const PendingApproval = () => {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans text-center">
            <div className="w-full max-w-lg mx-auto">
                {/* Logo and Header */}
                <div className="mb-8">
                    <a href="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                            <HeartPulse size={28} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">Curely</span>
                    </a>
                </div>

                {/* Main Content Box */}
                <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200/80">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={32} />
                    </div>
                    
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        Your Account is Under Review
                    </h1>
                    
                    <p className="text-slate-600 max-w-md mx-auto mt-4">
                        Thank you for signing up as a healthcare provider. Our team is currently reviewing your profile and documents for verification.
                    </p>
                    <p className="text-slate-600 max-w-md mx-auto mt-2">
                        You will receive an email notification once your account is approved. After that, you'll be able to access your dashboard and start connecting with patients.
                    </p>

                    <div className="mt-8">
                        <div className="inline-flex items-center gap-2 text-sm font-medium bg-slate-100 text-slate-700 py-2 px-4 rounded-lg">
                            <span className="animate-pulse">⏳</span>
                            <span>Waiting for Admin Approval</span>
                        </div>
                    </div>
                </div>

                 {/* Footer Link */}
                <p className="mt-8 text-center text-sm text-slate-600">
                    Need help?{' '}
                    <a href="/contact-support" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    );
};

export default PendingApproval;

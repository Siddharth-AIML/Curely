import React from 'react';
// The 'useNavigate' hook is for routing. This component assumes
// you have react-router-dom or a similar library set up.
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, ArrowRight, HeartPulse, Building2 } from 'lucide-react'; // Added Building2 for Lab icon

export default function SignupPage() {
    // Initialize the navigate function from the router hook
    const navigate = useNavigate();
    
    /**
     * Handles the user type selection and navigates to the
     * corresponding detailed sign-up page.
     * @param {'customer' | 'doctor' | 'lab'} type - The type of user signing up.
     */
    const handleUserTypeSelection = (type) => {
        if (type === 'customer') {
            navigate('/signup/customer');
        } else if (type === 'doctor') {
            navigate('/signup/doctor');
        } else if (type === 'lab') { // New Lab route
            navigate('/signup/lab');
        }
    };
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
            <div className="w-full max-w-md mx-auto">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                            <HeartPulse size={28} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">Curely</span>
                    </a>
                    <h2 className="mt-6 text-2xl font-bold text-slate-800">Join Curely</h2>
                    <p className="mt-2 text-sm text-slate-600">Choose your role to get started.</p>
                </div>

                {/* User Type Selection Container */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80">
                    <div className="space-y-4"> {/* Reduced space-y slightly for three options */}
                        {/* Customer/Patient Button */}
                        <UserTypeButton
                            icon={<User className="w-6 h-6 text-emerald-600" />}
                            title="I'm a Patient"
                            description="Access and manage your health records."
                            onClick={() => handleUserTypeSelection('customer')}
                        />
                        
                        {/* Doctor/Provider Button */}
                        <UserTypeButton
                            icon={<Stethoscope className="w-6 h-6 text-emerald-600" />}
                            title="I'm a Doctor"
                            description="Provide healthcare services to patients."
                            onClick={() => handleUserTypeSelection('doctor')}
                        />

                        {/* Lab Button (NEW) */}
                        <UserTypeButton
                            icon={<Building2 className="w-6 h-6 text-teal-600" />} // Used teal color for Lab distinction
                            title="I'm a Laboratory"
                            description="Manage test reports and diagnostic services."
                            onClick={() => handleUserTypeSelection('lab')} // New handler
                        />
                    </div>
                </div>

                {/* Login Link */}
                <p className="mt-8 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <a href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}

/**
 * A reusable button component for selecting a user type.
 * @param {{icon: React.ReactNode, title: string, description: string, onClick: () => void}} props
 */
const UserTypeButton = ({ icon, title, description, onClick }) => (
    <button 
        className="w-full flex items-center text-left p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 group" // Updated hover/focus colors to teal
        onClick={onClick}
    >
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-slate-200 group-hover:border-teal-200 transition-colors">
            {icon}
        </div>
        <div className="ml-4 flex-grow">
            <span className="font-bold text-slate-800">{title}</span>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors ml-4" />
    </button>
);
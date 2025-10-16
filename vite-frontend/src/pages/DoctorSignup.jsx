import React, { useState } from 'react';
// Using useNavigate as in the original file for redirection
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, User, Mail, Phone, Lock, Briefcase, Stethoscope, Star, Banknote, MapPin, Building } from 'lucide-react';

export default function DoctorSignup() {
  const navigate = useNavigate();
  
  // A single state object to hold all form data
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    licenseNumber: '', specialization: '', experience: '', fee: '',
    country: '', state: '', city: '', pincode: '',
    clinic_name: '', address: '',
  });
  
  // State for UI and logic
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles changes in form inputs and updates the state.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handles the form submission for doctor registration.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- Form Validation ---
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }
    if (!consent) {
      setError("You must agree to the terms and privacy policy to proceed.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch("https://curely-backend-api-awaygqhcgthzdnha.southindia-01.azurewebsites.net/api/auth/signup/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Signup failed. Please ensure all details are correct.");
      }

      // On success, redirect to the pending approval page
      navigate("/pending-approval");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 font-sans">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                    <HeartPulse size={28} />
                </div>
                <span className="font-bold text-2xl tracking-tight text-slate-900">Curely</span>
            </a>
            <h2 className="mt-6 text-2xl font-bold text-slate-800">Provider Registration</h2>
            <p className="mt-2 text-sm text-slate-600">Join our network of trusted healthcare professionals.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80 space-y-8">
          
          {/* --- Personal Information --- */}
          <FormSection title="Personal Information">
            <div className="grid md:grid-cols-2 gap-5">
              <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="Dr. Jane Smith" required />
              <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="jane.smith@clinic.com" required />
              <InputField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
              <InputField label="Medical License Number" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="MH123456" required />
              <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create a secure password" required />
              <InputField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required />
            </div>
          </FormSection>

          {/* --- Professional Details --- */}
          <FormSection title="Professional Details">
            <div className="grid md:grid-cols-2 gap-5">
              <SelectField label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} required>
                  <option value="">Select Specialization</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Other">Other</option>
              </SelectField>
              <InputField label="Years of Experience" name="experience" type="number" min="0" value={formData.experience} onChange={handleChange} placeholder="8" required />
              <InputField label="Consultation Fee (₹)" name="fee" type="number" min="0" value={formData.fee} onChange={handleChange} placeholder="500" required />
            </div>
          </FormSection>

          {/* --- Location Details --- */}
          <FormSection title="Clinic & Location Details">
             <div className="grid md:grid-cols-2 gap-5">
                <InputField label="Clinic Name" name="clinic_name" value={formData.clinic_name} onChange={handleChange} placeholder="Curely Clinic" required />
                <InputField label="Country" name="country" value={formData.country} onChange={handleChange} placeholder="India" required />
                <InputField label="State" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" required />
                <InputField label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" required />
                <InputField label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="400001" required />
             </div>
             <div className="mt-5">
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
                <textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="12/A, Marine Lines, Mumbai" required className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" rows="3"></textarea>
             </div>
          </FormSection>

          {/* Consent Checkbox */}
          <div className="pt-4 border-t border-slate-200">
            <label className="flex items-start">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="h-4 w-4 mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="ml-3 text-sm text-slate-600">
                I confirm that my information is accurate and I agree to the <Link to="/terms" className="font-medium text-emerald-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="font-medium text-emerald-600 hover:underline">Privacy Policy</Link>.
              </span>
            </label>
          </div>

          {/* Error and Submit */}
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:bg-emerald-400" disabled={loading}>
            {loading ? "Creating Account..." : "Create Doctor Account"}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Login</Link>
        </p>
      </div>
    </div>
  );
}

// --- Reusable Helper Components for Doctor Form ---

const FormSection = ({ title, children }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">{title}</h3>
    {children}
  </div>
);

const InputField = ({ label, ...props }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input {...props} id={props.name} className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select {...props} id={props.name} className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
      {children}
    </select>
  </div>
);

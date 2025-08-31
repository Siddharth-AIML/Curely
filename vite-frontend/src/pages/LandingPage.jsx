import React from 'react';
import { 
  HeartPulse, 
  ArrowRight, 
  ShieldCheck, 
  BookMarked, 
  Clock, 
  FolderKanban, 
  Share2, 
  CalendarPlus,
  Lock
} from 'lucide-react';

// Main component for the landing page
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Header Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <HeartPulse size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Curely</span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
              <a href="#security" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Security</a>
              <a href="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Login</a>
              <a
                href="/signup"
                className="ml-4 inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition-all"
              >
                Get Started
              </a>
            </nav>
            {/* Mobile menu button would go here */}
          </div>
        </div>
      </header>

      <main className="pt-24 sm:pt-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tighter mb-6">
                Healthcare, simplified — secure, unified, and made for you.
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
                Centralize medical records, manage appointments, and share information securely with providers — all in one premium platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all transform hover:scale-105"
                >
                  Create free account
                  <ArrowRight size={20} />
                </a>
                <a
                  href="#features"
                  className="text-sm w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                >
                  Learn more
                </a>
              </div>
            </div>

            {/* Hero Card */}
            <div className="flex justify-center">
              <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Secure. Private. Intuitive.</h2>
                <p className="text-sm text-slate-500 mb-8">Designed for patients and providers who expect clarity and trust.</p>
                <ul className="space-y-5">
                  <FeatureListItem 
                    icon={<ShieldCheck className="text-emerald-500" />}
                    title="Encrypted Records"
                    description="End-to-end encryption for all your sensitive data."
                  />
                  <FeatureListItem 
                    icon={<BookMarked className="text-emerald-500" />}
                    title="One Source of Truth"
                    description="A single, verified record shared with trusted providers."
                  />
                  <FeatureListItem 
                    icon={<Clock className="text-emerald-500" />}
                    title="Quick Access"
                    description="Appointments, prescriptions, and history at a glance."
                  />
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-slate-100 rounded-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need, in one place</h2>
            <p className="mt-4 text-lg text-slate-600">Take control of your health journey with powerful, easy-to-use tools.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FolderKanban size={32} className="text-emerald-600" />}
              title="Centralized Records"
              description="All your clinical documents, consolidated and easily shareable with your care team."
            />
            <FeatureCard
              icon={<Share2 size={32} className="text-emerald-600" />}
              title="Secure Sharing"
              description="Granular permissions to control who sees what and when, putting you in charge."
            />
            <FeatureCard
              icon={<CalendarPlus size={32} className="text-emerald-600" />}
              title="Smart Scheduling"
              description="Book and manage appointments without the back-and-forth calls and emails."
            />
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-12 shadow-lg shadow-slate-200/50 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">Built with privacy-first principles</h3>
              <p className="text-slate-600 max-w-2xl">We follow strict compliance practices and minimal data collection to keep your information safe, always.</p>
            </div>
            <div className="flex items-center gap-6">
              <SecurityPillar icon={<Lock className="text-emerald-600" />} title="Encryption" />
              <SecurityPillar icon={<ShieldCheck className="text-emerald-600" />} title="Compliance" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
          <div className="rounded-3xl p-8 lg:p-12 bg-emerald-600 text-white flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
            <div>
              <h4 className="text-2xl font-bold">Ready to simplify your healthcare?</h4>
              <p className="text-sm text-emerald-100 mt-2 max-w-xl">Create a secure account and take control of your medical records today. It's free to get started.</p>
            </div>
            <a href="/signup" className="flex-shrink-0 px-6 py-3 bg-white text-emerald-700 rounded-lg font-semibold shadow-lg hover:bg-slate-100 transition-all transform hover:scale-105">
              Sign up for free
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Curely — All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Helper component for list items in the hero card
const FeatureListItem = ({ icon, title, description }) => (
  <li className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-sm text-slate-500">{description}</div>
    </div>
  </li>
);

// Helper component for feature cards
const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all">
    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-600">{description}</p>
  </div>
);

// Helper component for security pillars
const SecurityPillar = ({ icon, title }) => (
  <div className="text-center">
    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-white flex items-center justify-center mb-3">
      {icon}
    </div>
    <div className="text-sm font-semibold text-slate-800">{title}</div>
  </div>
);

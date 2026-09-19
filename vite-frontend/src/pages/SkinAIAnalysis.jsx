import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Image as ImageIcon, Loader2, RotateCcw, ScanSearch, ShieldCheck, Upload } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import DoctorDashboardLayout from '../components/DoctorDashboardLayout.jsx';
import { analyzeSkinImage, getCustomerProfile, getDoctorProfile } from '../services/api.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AI_SERVICE_URL = (import.meta.env.VITE_AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const formatClassName = (value) => value ? value.toUpperCase() : 'Unavailable';
const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(2)}%`;

export default function SkinAIAnalysis() {
    const location = useLocation();
    const navigate = useNavigate();
    const isDoctor = location.pathname.startsWith('/doctor/');
    const fileInputRef = useRef(null);
    const [profile, setProfile] = useState(null);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        const loadProfile = async () => {
            if (!localStorage.getItem('token')) {
                navigate('/login');
                return;
            }
            try {
                const response = await (isDoctor ? getDoctorProfile() : getCustomerProfile());
                if (mounted) setProfile(response.data);
            } catch (requestError) {
                if (requestError.response?.status === 401 || requestError.response?.status === 403) navigate('/login');
                else if (mounted) setError('Unable to load your profile. Please try again.');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadProfile();
        return () => { mounted = false; };
    }, [isDoctor, navigate]);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const handleFile = (selectedFile) => {
        setError('');
        setResult(null);
        if (!selectedFile) return;
        if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
            setFile(null);
            setPreviewUrl('');
            setError('Please choose a JPG, JPEG, PNG, or WEBP image.');
            return;
        }
        if (selectedFile.size === 0) {
            setFile(null);
            setPreviewUrl('');
            setError('The selected image is empty. Please choose another file.');
            return;
        }
        if (selectedFile.size > MAX_FILE_SIZE) {
            setFile(null);
            setPreviewUrl('');
            setError('Please choose an image smaller than 10 MB.');
            return;
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
    };

    const handleAnalyze = async () => {
        if (!file || analyzing) return;
        setAnalyzing(true);
        setError('');
        try {
            const response = await analyzeSkinImage(file);
            if (!response.data?.prediction || !Array.isArray(response.data?.predictions)) {
                throw new Error('Malformed response');
            }
            setResult({ ...response.data, analyzedAt: new Date() });
        } catch (requestError) {
            const message = requestError.response?.data?.message;
            setError(message || 'Skin analysis service is currently unavailable. Please try again later.');
        } finally {
            setAnalyzing(false);
        }
    };

    const resetAnalysis = () => {
        setFile(null);
        setPreviewUrl('');
        setResult(null);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const Layout = isDoctor ? DoctorDashboardLayout : DashboardLayout;
    if (loading) return <div className="w-screen h-screen flex justify-center items-center bg-slate-100"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;

    return (
        <Layout activeItem="skin-ai" userProfile={profile}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><ScanSearch size={24} /></div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Skin AI Analysis</h1>
                            <p className="text-slate-500 mt-1">AI-assisted skin lesion analysis with explainable results.</p>
                        </div>
                    </div>
                </div>

                {error && <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle size={20} className="mt-0.5 shrink-0" /><span>{error}</span></div>}

                {!result ? (
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                        <div className="flex items-center gap-3 mb-5"><Upload className="text-emerald-600" size={22} /><h2 className="text-lg font-semibold text-slate-800">Upload a skin image</h2></div>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
                        {previewUrl ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <img src={previewUrl} alt="Selected skin image preview" className="w-full max-h-80 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                                <div>
                                    <p className="font-medium text-slate-800 break-words">{file.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">Change Image</button>
                                        <button type="button" onClick={handleAnalyze} disabled={analyzing} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                            {analyzing ? <Loader2 size={18} className="animate-spin" /> : <ScanSearch size={18} />}{analyzing ? 'Analyzing image...' : 'Analyze Image'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full min-h-56 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-colors flex flex-col items-center justify-center px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <ImageIcon size={40} className="text-slate-400 mb-3" /><span className="font-semibold text-slate-700">Choose Image</span><span className="text-sm text-slate-500 mt-1">JPG, JPEG, PNG or WEBP, up to 10 MB</span>
                            </button>
                        )}
                    </section>
                ) : (
                    <ResultView result={result} previewUrl={previewUrl} onReset={resetAnalysis} />
                )}
            </div>
        </Layout>
    );
}

function ResultView({ result, previewUrl, onReset }) {
    const heatmapUrl = result.heatmap_url ? (result.heatmap_url.startsWith('http') ? result.heatmap_url : `${AI_SERVICE_URL}${result.heatmap_url}`) : '';
    return <div className="space-y-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex flex-wrap justify-between gap-4 items-start"><div><p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">AI Prediction</p><h2 className="text-3xl font-bold text-slate-800 mt-1">{formatClassName(result.prediction)}</h2></div><CheckCircle2 className="text-emerald-600" size={28} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6"><Metric label="Confidence" value={formatPercent(result.confidence)} /><Metric label="Model" value={result.model_version || 'Unavailable'} /><Metric label="Analyzed" value={result.analyzedAt.toLocaleString()} /></div>
        </section>
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80"><h2 className="text-lg font-semibold text-slate-800 mb-4">Probability Distribution</h2><div className="space-y-4">{result.predictions.map((item) => <div key={item.class}><div className="flex justify-between text-sm mb-1"><span className="font-medium text-slate-700">{item.class.toUpperCase()}</span><span className="text-slate-500">{formatPercent(item.probability)}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, Number(item.probability || 0) * 100))}%` }} /></div></div>)}</div></section>
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80"><h2 className="text-lg font-semibold text-slate-800">Model Explainability</h2><p className="text-sm text-slate-500 mt-1">The heatmap highlights image regions that contributed to the model's prediction.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">{previewUrl && <ImagePanel title="Original Image" src={previewUrl} alt="Original skin image" />}{heatmapUrl ? <ImagePanel title="Grad-CAM Heatmap" src={heatmapUrl} alt="Grad-CAM heatmap showing regions contributing to the prediction" /> : <div className="rounded-lg bg-slate-50 p-6 text-sm text-slate-500 flex items-center gap-2"><ImageIcon size={20} />Heatmap is not available for this result.</div>}</div></section>
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><ShieldCheck size={20} className="mt-0.5 shrink-0" /><p>AI-assisted analysis only. This result is not a medical diagnosis and should be reviewed by a qualified healthcare professional.</p></div>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"><RotateCcw size={18} />Analyze Another Image</button>
    </div>;
}

function Metric({ label, value }) { return <div className="bg-slate-50 rounded-lg p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="font-semibold text-slate-800 mt-1 break-words">{value}</p></div>; }
function ImagePanel({ title, src, alt }) { return <div><h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3><img src={src} alt={alt} className="w-full max-h-96 object-contain rounded-lg border border-slate-200 bg-slate-50" onError={(event) => { event.currentTarget.replaceWith(Object.assign(document.createElement('p'), { className: 'text-sm text-slate-500 bg-slate-50 rounded-lg p-6', textContent: 'This image could not be loaded.' })); }} /></div>; }
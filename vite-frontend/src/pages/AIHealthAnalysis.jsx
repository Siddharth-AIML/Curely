import React, { useEffect, useRef, useState } from 'react';
import {
    AlertTriangle,
    BrainCircuit,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
    RotateCcw,
    ScanSearch,
    ShieldCheck,
    Sparkles,
    Upload
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import DoctorDashboardLayout from '../components/DoctorDashboardLayout.jsx';
import {
    analyzeBrainMRI,
    analyzeSkinImage,
    getCustomerProfile,
    getDoctorProfile,
} from '../services/api.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AI_SERVICE_URL = (import.meta.env.VITE_AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const AI_ANALYSES = [
    {
        id: 'skin',
        title: 'Skin Lesion Analysis',
        description: 'AI-assisted skin lesion classification with Grad-CAM',
        available: true,
    },
    {
        id: 'brain',
        title: 'Brain MRI Analysis',
        description: 'MRI tumor segmentation using U-Net',
        available: true,
    },
    {
        id: 'diabetes',
        title: 'Diabetes Risk Prediction',
        description: 'Coming soon',
        available: false,
    },
    {
        id: 'kidney',
        title: 'Kidney Stone Analysis',
        description: 'Coming soon',
        available: false,
    },
];

const formatClassName = (value) => (value ? value.toUpperCase() : 'Unavailable');
const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(2)}%`;
const normalizeImageUrl = (value) => {
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('data:')) return value;
    return `${AI_SERVICE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

export default function AIHealthAnalysis() {
    const location = useLocation();
    const navigate = useNavigate();
    const isDoctor = location.pathname.startsWith('/doctor/');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAnalysisId, setSelectedAnalysisId] = useState('skin');

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
                if (requestError.response?.status === 401 || requestError.response?.status === 403) {
                    navigate('/login');
                } else if (mounted) {
                    setError('Unable to load your profile. Please try again.');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadProfile();

        return () => {
            mounted = false;
        };
    }, [isDoctor, navigate]);

    const Layout = isDoctor ? DoctorDashboardLayout : DashboardLayout;
    const selectedAnalysis = AI_ANALYSES.find((analysis) => analysis.id === selectedAnalysisId) || AI_ANALYSES[0];

    if (loading) {
        return (
            <div className="w-screen h-screen flex justify-center items-center bg-slate-100">
                <Loader2 className="animate-spin text-emerald-600" size={48} />
            </div>
        );
    }

    return (
        <Layout activeItem="ai-health" userProfile={profile}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">AI Health Analysis</h1>
                            <p className="text-slate-500 mt-1">AI-assisted decision support for skin and brain imaging analysis.</p>
                        </div>
                    </div>

                    <div className="w-full max-w-md">
                        <label htmlFor="ai-analysis-select" className="block text-sm font-medium text-slate-700 mb-2">
                            Select Analysis
                        </label>
                        <select
                            id="ai-analysis-select"
                            value={selectedAnalysisId}
                            onChange={(event) => setSelectedAnalysisId(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                            {AI_ANALYSES.map((analysis) => (
                                <option key={analysis.id} value={analysis.id} disabled={!analysis.available}>
                                    {analysis.available ? analysis.title : `${analysis.title} (Coming Soon)`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">Selected analysis</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold text-slate-800">{selectedAnalysis.title}</span>
                        {!selectedAnalysis.available && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Coming Soon
                            </span>
                        )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{selectedAnalysis.description}</p>
                </div>

                {selectedAnalysisId === 'skin' && <SkinAnalysisPanel />}
                {selectedAnalysisId === 'brain' && <BrainMRIAnalysisPanel />}
                {selectedAnalysisId !== 'skin' && selectedAnalysisId !== 'brain' && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <Sparkles size={28} />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-800">{selectedAnalysis.title}</h2>
                        <p className="mt-3 text-slate-500">This analysis is not available yet. It will be added as a future AI module.</p>
                    </section>
                )}
            </div>
        </Layout>
    );
}

function SkinAnalysisPanel() {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const handleFile = (selectedFile) => {
        setError('');
        setResult(null);

        if (!selectedFile) return;

        if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
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
            const message = requestError.response?.data?.message || 'Skin analysis service is currently unavailable. Please try again later.';
            setError(message);
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

    if (error && !file && !result) {
        setTimeout(() => undefined, 0);
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <ScanSearch className="text-emerald-600" size={22} />
                    <h2 className="text-xl font-semibold text-slate-800">Skin Lesion Analysis</h2>
                </div>

                {!!error && (
                    <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!result ? (
                    <>
                        <p className="mb-4 text-slate-600">Upload a dermoscopic image to begin AI-assisted lesion analysis.</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(event) => handleFile(event.target.files?.[0])}
                        />

                        {previewUrl ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
                                <img
                                    src={previewUrl}
                                    alt="Selected skin image preview"
                                    className="w-full max-h-80 object-contain rounded-lg border border-slate-200 bg-slate-50"
                                />
                                <div>
                                    <p className="font-medium text-slate-800 break-words">{file.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            Change Image
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAnalyze}
                                            disabled={analyzing}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {analyzing ? <Loader2 size={18} className="animate-spin" /> : <ScanSearch size={18} />}
                                            {analyzing ? 'AI is analyzing the image...' : 'Analyze Skin Lesion'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full min-h-56 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-colors flex flex-col items-center justify-center px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <ImageIcon size={40} className="text-slate-400 mb-3" />
                                <span className="font-semibold text-slate-700">Upload Image</span>
                                <span className="text-sm text-slate-500 mt-1">JPG, JPEG, PNG or WEBP, up to 10 MB</span>
                            </button>
                        )}
                    </>
                ) : (
                    <SkinResultView result={result} previewUrl={previewUrl} onReset={resetAnalysis} />
                )}
            </section>
        </div>
    );
}

function SkinResultView({ result, previewUrl, onReset }) {
    const heatmapUrl = result.heatmap_url ? normalizeImageUrl(result.heatmap_url) : '';

    return (
        <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">AI Prediction</p>
                        <h2 className="mt-1 text-3xl font-bold text-slate-800">{formatClassName(result.prediction)}</h2>
                    </div>
                    <CheckCircle2 className="text-emerald-600" size={28} />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Metric label="Confidence" value={formatPercent(result.confidence)} />
                    <Metric label="Model" value={result.model_version || 'Unavailable'} />
                    <Metric label="Analyzed" value={result.analyzedAt.toLocaleString()} />
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Class probabilities</h2>
                <div className="space-y-4">
                    {result.predictions.map((item) => (
                        <div key={item.class}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-700">{item.class.toUpperCase()}</span>
                                <span className="text-slate-500">{formatPercent(item.probability)}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${Math.min(100, Math.max(0, Number(item.probability || 0) * 100))}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800">Explainability</h2>
                <p className="mt-1 text-sm text-slate-500">The heatmap highlights regions contributing to the model's predicted class.</p>
                <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {previewUrl && <ImagePanel title="Original Image" src={previewUrl} alt="Original skin image" />}
                    {heatmapUrl ? (
                        <ImagePanel title="Grad-CAM Heatmap" src={heatmapUrl} alt="Grad-CAM heatmap showing regions contributing to the prediction" />
                    ) : (
                        <div className="rounded-lg bg-slate-50 p-6 text-sm text-slate-500 flex items-center gap-2">
                            <ImageIcon size={20} />
                            Heatmap is not available for this result.
                        </div>
                    )}
                </div>
            </section>

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                <p>This AI-generated result is intended for clinical decision support and does not replace professional medical evaluation or diagnosis.</p>
            </div>

            <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
                <RotateCcw size={18} />
                Analyze Another Image
            </button>
        </div>
    );
}

function BrainMRIAnalysisPanel() {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const handleFile = (selectedFile) => {
        setError('');
        setResult(null);

        if (!selectedFile) return;

        if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
            setFile(null);
            setPreviewUrl('');
            setError('Please choose a JPG, JPEG, PNG, or WEBP MRI image.');
            return;
        }

        if (selectedFile.size === 0) {
            setFile(null);
            setPreviewUrl('');
            setError('The selected MRI scan is empty. Please choose another file.');
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setFile(null);
            setPreviewUrl('');
            setError('Please choose an MRI scan smaller than 10 MB.');
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
            const response = await analyzeBrainMRI(file);
            const data = response.data || {};

            if (!data || typeof data !== 'object') {
                throw new Error('Malformed response');
            }

            setResult({
                tumor_detected: data.tumor_detected ?? data.tumorDetected ?? false,
                tumor_area_percent: data.tumor_area_percent ?? data.tumorAreaPercent ?? null,
                segmentation_url: data.segmentation_url ?? data.segmentationUrl ?? '',
                overlay_url: data.overlay_url ?? data.overlayUrl ?? '',
                model_version: data.model_version ?? data.modelVersion ?? 'U-Net',
                analyzedAt: new Date(),
            });
        } catch (requestError) {
            const message = requestError.response?.data?.message || 'Brain MRI analysis is currently unavailable. Please try again later.';
            setError(message);
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

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <BrainCircuit className="text-emerald-600" size={22} />
                    <h2 className="text-xl font-semibold text-slate-800">Brain MRI Analysis</h2>
                </div>

                {!!error && (
                    <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!result ? (
                    <>
                        <p className="mb-4 text-slate-600">Upload an MRI scan to begin AI-assisted tumor segmentation.</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(event) => handleFile(event.target.files?.[0])}
                        />

                        {previewUrl ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
                                <img
                                    src={previewUrl}
                                    alt="Selected MRI preview"
                                    className="w-full max-h-80 object-contain rounded-lg border border-slate-200 bg-slate-50"
                                />
                                <div>
                                    <p className="font-medium text-slate-800 break-words">{file.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            Change MRI
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAnalyze}
                                            disabled={analyzing}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {analyzing ? <Loader2 size={18} className="animate-spin" /> : <ScanSearch size={18} />}
                                            {analyzing ? 'AI is analyzing the MRI...' : 'Analyze MRI'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full min-h-56 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-colors flex flex-col items-center justify-center px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <ImageIcon size={40} className="text-slate-400 mb-3" />
                                <span className="font-semibold text-slate-700">Upload MRI Scan</span>
                                <span className="text-sm text-slate-500 mt-1">JPG, JPEG, PNG or WEBP, up to 10 MB</span>
                            </button>
                        )}
                    </>
                ) : (
                    <BrainResultView result={result} previewUrl={previewUrl} onReset={resetAnalysis} />
                )}
            </section>
        </div>
    );
}

function BrainResultView({ result, previewUrl, onReset }) {
    const segmentationUrl = result.segmentation_url ? normalizeImageUrl(result.segmentation_url) : '';
    const overlayUrl = result.overlay_url ? normalizeImageUrl(result.overlay_url) : '';

    return (
        <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Brain MRI Analysis</p>
                        <h2 className="mt-1 text-3xl font-bold text-slate-800">Predicted Tumor Segmentation</h2>
                    </div>
                    <CheckCircle2 className="text-emerald-600" size={28} />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Metric label="Tumor detected" value={result.tumor_detected ? 'YES' : 'NO'} />
                    <Metric label="Tumor area" value={result.tumor_area_percent !== null && result.tumor_area_percent !== undefined ? `${Number(result.tumor_area_percent).toFixed(2)}%` : 'Not available'} />
                    <Metric label="Model" value={result.model_version || 'U-Net'} />
                </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Segmentation Visualization</h2>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {previewUrl && <ImagePanel title="Original MRI" src={previewUrl} alt="Original MRI scan" />}
                    {segmentationUrl ? (
                        <ImagePanel title="Segmentation Mask" src={segmentationUrl} alt="Segmentation mask showing predicted tumor region" />
                    ) : (
                        <div className="rounded-lg bg-slate-50 p-6 text-sm text-slate-500 flex items-center gap-2">
                            <ImageIcon size={20} />
                            Segmentation mask is not available for this result.
                        </div>
                    )}
                    {overlayUrl ? (
                        <ImagePanel title="Segmentation Overlay" src={overlayUrl} alt="Overlay showing predicted tumor area over the MRI" />
                    ) : (
                        <div className="rounded-lg bg-slate-50 p-6 text-sm text-slate-500 flex items-center gap-2">
                            <ImageIcon size={20} />
                            Overlay visualization is not available for this result.
                        </div>
                    )}
                </div>
            </section>

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                <p>This AI-generated segmentation is intended for clinical decision support and does not replace professional medical evaluation or diagnosis.</p>
            </div>

            <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
                <RotateCcw size={18} />
                Analyze Another MRI
            </button>
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 break-words font-semibold text-slate-800">{value}</p>
        </div>
    );
}

function ImagePanel({ title, src, alt }) {
    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
            <img
                src={src}
                alt={alt}
                className="w-full max-h-96 object-contain rounded-lg border border-slate-200 bg-slate-50"
                onError={(event) => {
                    event.currentTarget.replaceWith(
                        Object.assign(document.createElement('p'), {
                            className: 'text-sm text-slate-500 bg-slate-50 rounded-lg p-6',
                            textContent: 'This image could not be loaded.'
                        })
                    );
                }}
            />
        </div>
    );
}

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, HeartPulse, Loader2, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '/src/components/DashboardLayout.jsx';
import { analyzeSymptoms, getCustomerProfile, getSymptomSchema } from '/src/services/api.js';
import {
    getSymptomErrorMessage,
    isSymptomAnalysisResponse,
    isSymptomSchemaResponse,
} from './symptomCheckerUtils.js';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function SymptomChecker() {
    const [userProfile, setUserProfile] = useState(null);
    const [schema, setSchema] = useState(null);
    const [schemaError, setSchemaError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [description, setDescription] = useState('');
    const [result, setResult] = useState(null);
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        Promise.all([
            getSymptomSchema(),
            getCustomerProfile().catch((error) => {
                if (error.response?.status === 401) navigate('/login');
                return null;
            }),
        ]).then(([schemaResponse, profileResponse]) => {
            const data = schemaResponse.data;
            if (!isSymptomSchemaResponse(data)) {
                throw new Error('The supported symptom vocabulary is unavailable.');
            }
            if (mounted) {
                setSchema(data);
                if (profileResponse) setUserProfile(profileResponse.data);
            }
        }).catch((error) => {
            if (mounted) setSchemaError(getSymptomErrorMessage(error));
        }).finally(() => {
            if (mounted) setLoading(false);
        });
        return () => {
            mounted = false;
        };
    }, [navigate]);

    const symptomsById = useMemo(
        () => new Map((schema?.symptoms || []).map((symptom) => [symptom.id, symptom])),
        [schema],
    );
    const filteredSymptoms = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return [];
        return (schema?.symptoms || [])
            .filter((symptom) => (
                !selectedIds.includes(symptom.id)
                && `${symptom.name} ${(symptom.aliases || []).join(' ')}`.toLowerCase().includes(query)
            ))
            .slice(0, 8);
    }, [schema, searchTerm, selectedIds]);

    const addSymptom = (symptomId) => {
        setSelectedIds((previous) => previous.includes(symptomId) ? previous : [...previous, symptomId]);
        setSearchTerm('');
        setResult(null);
        setApiError('');
    };

    const removeSymptom = (symptomId) => {
        setSelectedIds((previous) => previous.filter((id) => id !== symptomId));
        setResult(null);
    };

    const handleUseSuggestion = (term, suggestion) => {
        addSymptom(suggestion.id);
        const termPattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
        setDescription((previous) => previous.replace(termPattern, ' ').replace(/\s+/g, ' ').trim());
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting || (!selectedIds.length && !description.trim())) return;
        setSubmitting(true);
        setApiError('');
        setResult(null);
        try {
            const response = await analyzeSymptoms({
                symptom_ids: selectedIds,
                description,
            });
            if (!isSymptomAnalysisResponse(response.data)) {
                throw new Error('The symptom service returned an invalid response.');
            }
            setResult(response.data);
        } catch (error) {
            setApiError(getSymptomErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout activeItem="symptom-checker" userProfile={userProfile}>
            <div className="mb-8">
                <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-800">
                    Symptom Checker
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">Beta</span>
                </h1>
                <p className="mt-1 text-slate-500">
                    Select model-supported symptoms or describe them in your own words.
                </p>
            </div>

            {loading ? (
                <div className="rounded-2xl border bg-white p-10 text-center" role="status">
                    <Loader2 className="mx-auto animate-spin text-emerald-600" size={30} />
                    <p className="mt-3 text-slate-600">Loading supported symptoms...</p>
                </div>
            ) : schemaError ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700" role="alert">
                    <AlertTriangle className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Symptom vocabulary unavailable</p>
                        <p className="mt-1 text-sm">{schemaError}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <form onSubmit={handleSubmit} className="space-y-6 self-start rounded-2xl border bg-white p-6 shadow-sm lg:col-span-1">
                        <div>
                            <label htmlFor="symptom-search" className="mb-2 block text-sm font-medium text-slate-700">
                                Search supported symptoms
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    id="symptom-search"
                                    type="search"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Search the model's symptom vocabulary"
                                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    autoComplete="off"
                                />
                            </div>
                            {filteredSymptoms.length > 0 && (
                                <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg" aria-label="Matching supported symptoms">
                                    {filteredSymptoms.map((symptom) => (
                                        <li key={symptom.id}>
                                            <button
                                                type="button"
                                                onClick={() => addSymptom(symptom.id)}
                                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                                            >
                                                <span className="block">{symptom.name}</span>
                                                {symptom.aliases?.length > 0 && (
                                                    <span className="text-xs text-slate-500">
                                                        Also known as: {symptom.aliases.join(', ')}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {searchTerm && filteredSymptoms.length === 0 && (
                                <p className="mt-2 text-xs text-slate-500">
                                    No exact vocabulary match. You can describe it below; unsupported terms will be identified.
                                </p>
                            )}
                        </div>

                        <div>
                            <h2 className="mb-2 text-sm font-semibold text-slate-800">Selected symptoms</h2>
                            <div className="flex min-h-10 flex-wrap gap-2">
                                {selectedIds.map((symptomId) => {
                                    const symptom = symptomsById.get(symptomId);
                                    if (!symptom) return null;
                                    return (
                                        <span key={symptomId} className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
                                            {symptom.name}
                                            <button
                                                type="button"
                                                onClick={() => removeSymptom(symptomId)}
                                                aria-label={`Remove ${symptom.name}`}
                                                className="rounded-full text-emerald-700 hover:text-emerald-950"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    );
                                })}
                                {selectedIds.length === 0 && <p className="text-sm text-slate-400">No symptoms selected.</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="symptom-description" className="mb-2 block text-sm font-medium text-slate-700">
                                Or describe your symptoms
                            </label>
                            <textarea
                                id="symptom-description"
                                value={description}
                                onChange={(event) => {
                                    setDescription(event.target.value);
                                    setResult(null);
                                }}
                                maxLength={1000}
                                rows={4}
                                placeholder="For example: I have a headache, fever, and nausea."
                                className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                            <p className="mt-1 text-right text-xs text-slate-400">{description.length}/1000</p>
                        </div>

                        {apiError && (
                            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                                <span>{apiError}</span>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={submitting || (!selectedIds.length && !description.trim())}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <HeartPulse size={18} />}
                            {submitting ? 'Analyzing with model...' : 'Analyze symptoms'}
                        </button>
                    </form>

                    <section className="min-h-[500px] rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2" aria-live="polite">
                        {!result ? (
                            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center text-slate-500">
                                <HeartPulse size={48} className="mb-4 text-slate-300" />
                                <h2 className="text-lg font-semibold text-slate-700">Model-ranked hypotheses</h2>
                                <p className="mt-2 max-w-md text-sm">
                                    Your selected and recognized symptoms will be evaluated together by the saved Naive Bayes model.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Model-ranked hypotheses</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {result.model_name} · {result.probability_description || 'No model probability available.'}
                                    </p>
                                </div>

                                {result.recognized_symptoms.length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-slate-700">Symptoms recognized and used</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {result.accepted_evidence.map((item) => (
                                                <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                                                    {item.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.unsupported_terms.length > 0 && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                        <h3 className="font-semibold text-amber-900">Please review unsupported terms</h3>
                                        <p className="mt-1 text-sm text-amber-800">
                                            These terms are not model evidence. They were not used in the result.
                                        </p>
                                        <ul className="mt-3 space-y-3">
                                            {result.unsupported_terms.map((item) => (
                                                <li key={item.term} className="text-sm text-amber-900">
                                                    <span className="font-medium">“{item.term}”</span>
                                                    {item.suggestions?.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {item.suggestions.map((suggestion) => (
                                                                <button
                                                                    key={suggestion.id}
                                                                    type="button"
                                                                    onClick={() => handleUseSuggestion(item.term, suggestion)}
                                                                    className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs text-amber-900 hover:bg-amber-100"
                                                                >
                                                                    Use “{suggestion.label}”
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {result.clarifications.length > 0 && (
                                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                                        <h3 className="font-semibold">Clarification needed</h3>
                                        <p className="mt-1">Absent, uncertain, or conflicting reports were not treated as present evidence.</p>
                                        <ul className="mt-2 list-inside list-disc">
                                            {result.clarifications.map((item, index) => (
                                                <li key={`${item.symptom.id}-${index}`}>
                                                    {item.symptom.label}: {item.reason.replaceAll('_', ' ')}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {result.results.length > 0 ? (
                                    <ol className="space-y-3">
                                        {result.results.map((item, index) => (
                                            <li key={item.disease} className="rounded-xl border border-slate-200 p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <span className="mr-2 text-xs font-semibold text-slate-400">#{index + 1}</span>
                                                        <span className="font-semibold capitalize text-slate-800">{item.disease}</span>
                                                    </div>
                                                    <span className="shrink-0 font-semibold text-emerald-700">
                                                        {(item.probability * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500"
                                                        style={{ width: `${Math.min(item.probability * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                        No supported positive symptoms were identified, so the model was not run.
                                        Select a symptom or clarify your description to continue.
                                    </div>
                                )}

                                <p className="border-t pt-4 text-xs leading-relaxed text-slate-500">
                                    The disease-root Bernoulli Naive Bayes network uses class and binary symptom counts
                                    from the saved {result.source_estimator || 'Naive Bayes'} estimator. The stored artifact
                                    is not a separately serialized BBN, and its training dataset is not present in this checkout.
                                    Probabilities are uncalibrated, not clinical risk estimates or a diagnosis.
                                    Only the listed recognized evidence was used. Consult a qualified healthcare professional.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            )}
            <p className="mt-5 text-center text-xs italic text-red-600">
                For informational use only. This tool cannot diagnose or replace professional medical advice.
            </p>
        </DashboardLayout>
    );
}

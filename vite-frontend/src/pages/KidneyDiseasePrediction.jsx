import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { getKidneyPredictionSchema, predictKidneyDisease } from '../services/api.js';

const getRequestError = (error) => (
    error.response?.data?.message
    || error.response?.data?.detail
    || 'Kidney prediction is currently unavailable. Please try again later.'
);

export default function KidneyDiseasePrediction() {
    const [schema, setSchema] = useState(null);
    const [form, setForm] = useState({});
    const [loadingSchema, setLoadingSchema] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => {
        let mounted = true;
        getKidneyPredictionSchema()
            .then(({ data }) => {
                if (!data?.success || !Array.isArray(data.features) || data.features.length === 0) {
                    throw new Error('Kidney prediction input schema is unavailable.');
                }
                if (mounted) {
                    setSchema(data);
                    setForm(Object.fromEntries(data.features.map((feature) => [feature.name, ''])));
                }
            })
            .catch((requestError) => {
                if (mounted) {
                    setError(requestError.response ? getRequestError(requestError) : requestError.message);
                }
            })
            .finally(() => {
                if (mounted) setLoadingSchema(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const formErrors = useMemo(() => {
        if (!schema) return {};
        return Object.fromEntries(schema.features.flatMap((feature) => {
            const value = form[feature.name];
            if (value === '' || value === undefined) {
                return [[feature.name, 'Required']];
            }
            if (feature.type === 'numeric') {
                const numericValue = Number(value);
                if (!Number.isFinite(numericValue)) {
                    return [[feature.name, 'Enter a valid number']];
                }
                if (feature.minimum !== null && feature.minimum !== undefined && numericValue < feature.minimum) {
                    return [[feature.name, `Must be at least ${feature.minimum}`]];
                }
            } else if (feature.type === 'categorical' && !feature.categories.includes(value)) {
                return [[feature.name, 'Choose a listed value']];
            }
            return [];
        }));
    }, [form, schema]);

    const handleChange = (feature, value) => {
        setForm((previous) => ({ ...previous, [feature.name]: value }));
        setResult(null);
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting || !schema) return;
        if (Object.keys(formErrors).length > 0) {
            setAttemptedSubmit(true);
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const payload = Object.fromEntries(schema.features.map((feature) => [
                feature.name,
                feature.type === 'numeric' ? Number(form[feature.name]) : form[feature.name],
            ]));
            const response = await predictKidneyDisease(payload);
            if (
                response.data?.success !== true
                || !schema.labels?.[response.data?.prediction]
                || typeof response.data?.predicted_label !== 'string'
            ) {
                throw new Error('The kidney prediction service returned an invalid response.');
            }
            setResult(response.data);
        } catch (requestError) {
            setError(requestError.response ? getRequestError(requestError) : requestError.message);
            setResult(null);
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingSchema) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm" aria-live="polite">
                <Loader2 className="mx-auto animate-spin text-emerald-600" size={28} />
                <p className="mt-3 text-sm text-slate-600">Loading kidney assessment fields...</p>
            </section>
        );
    }

    if (!schema) {
        return (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700" role="alert">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                    <span>{error || 'Kidney prediction input schema is unavailable.'}</span>
                </div>
            </section>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <ShieldCheck className="text-emerald-600" size={22} />
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Kidney Disease Prediction</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Enter the recorded clinical values. The form options are loaded from the trained model schema.
                        </p>
                    </div>
                </div>

                {!!error && (
                    <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {schema.features.map((feature) => {
                            const errorId = `kidney-${feature.name}-error`;
                            const fieldError = attemptedSubmit ? formErrors[feature.name] : '';
                            return (
                                <label key={feature.name} htmlFor={`kidney-${feature.name}`} className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                        {feature.label}
                                        {feature.units ? <span className="font-normal text-slate-500"> ({feature.units})</span> : null}
                                    </span>
                                    {feature.type === 'categorical' ? (
                                        <select
                                            id={`kidney-${feature.name}`}
                                            value={form[feature.name] || ''}
                                            onChange={(event) => handleChange(feature, event.target.value)}
                                            required
                                            aria-invalid={Boolean(fieldError)}
                                            aria-describedby={fieldError ? errorId : undefined}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                        >
                                            <option value="" disabled>Select an option</option>
                                            {feature.categories.map((category) => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            id={`kidney-${feature.name}`}
                                            type="number"
                                            min={feature.minimum ?? undefined}
                                            step="any"
                                            value={form[feature.name] || ''}
                                            onChange={(event) => handleChange(feature, event.target.value)}
                                            required
                                            aria-invalid={Boolean(fieldError)}
                                            aria-describedby={fieldError ? errorId : undefined}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                        />
                                    )}
                                    <span className="mt-1 block text-xs text-slate-500">{feature.description}</span>
                                    {fieldError && (
                                        <span id={errorId} className="mt-1 block text-xs text-red-600">
                                            {fieldError}
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                            {submitting ? 'Assessing...' : 'Assess Kidney Disease Risk'}
                        </button>
                        <p className="text-sm text-slate-500">All fields are required by this model.</p>
                    </div>
                </form>
            </section>

            {result && (
                <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm" aria-live="polite">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={24} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Model screening result</p>
                            <h3 className="mt-1 text-2xl font-bold text-slate-800">{result.predicted_label}</h3>
                            {schema.probability_supported && typeof result.probability === 'number' && (
                                <div className="mt-5">
                                    <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                                        <span className="font-medium text-slate-700">Model-estimated CKD probability</span>
                                        <span className="text-slate-600">{(result.probability * 100).toFixed(1)}%</span>
                                    </div>
                                    <div
                                        className="h-3 overflow-hidden rounded-full bg-slate-100"
                                        role="progressbar"
                                        aria-label="Model-estimated CKD probability"
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                        aria-valuenow={(result.probability * 100).toFixed(1)}
                                    >
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${Math.min(100, Math.max(0, result.probability * 100))}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        This is the classifier&apos;s probability estimate for the CKD class, not a measure of clinical certainty.
                                    </p>
                                </div>
                            )}
                            <p className="mt-4 text-sm text-slate-600">
                                {result.disclaimer || 'This is a screening estimate and not a medical diagnosis. Consult a qualified healthcare professional.'}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                This screening estimate is not a diagnosis and should not guide treatment decisions. Please consult a qualified healthcare professional for evaluation.
            </p>
        </div>
    );
}

export const getSymptomErrorMessage = (error) => (
    error.response?.data?.message
    || error.response?.data?.error
    || 'Symptom analysis is currently unavailable. Please try again.'
);

export const isSymptomSchemaResponse = (data) => (
    data?.success === true
    && Array.isArray(data.symptoms)
    && data.symptoms.length > 0
    && data.symptoms.every((symptom) => (
        typeof symptom?.id === 'string'
        && typeof symptom?.name === 'string'
        && typeof symptom?.evidence_variable === 'string'
        && Array.isArray(symptom?.aliases)
    ))
);

export const isSymptomAnalysisResponse = (data) => (
    data?.success === true
    && Array.isArray(data.recognized_symptoms)
    && data.recognized_symptoms.every((symptom) => (
        typeof symptom?.id === 'string'
        && typeof symptom?.name === 'string'
        && typeof symptom?.source === 'string'
    ))
    && Array.isArray(data.unsupported_terms)
    && data.unsupported_terms.every((item) => (
        typeof item?.term === 'string'
        && (item.suggestions === undefined || (
            Array.isArray(item.suggestions)
            && item.suggestions.every((suggestion) => (
                typeof suggestion?.id === 'string'
                && typeof suggestion?.label === 'string'
            ))
        ))
    ))
    && Array.isArray(data.clarifications)
    && data.clarifications.every((item) => (
        typeof item?.symptom?.id === 'string'
        && typeof item?.symptom?.label === 'string'
        && typeof item?.reason === 'string'
    ))
    && Array.isArray(data.results)
    && data.results.every((result) => (
        typeof result?.disease === 'string'
        && typeof result?.probability === 'number'
        && Number.isFinite(result.probability)
        && result.probability >= 0
        && result.probability <= 1
    ))
    && Array.isArray(data.accepted_evidence)
    && data.accepted_evidence.every((item) => (
        typeof item?.id === 'string'
        && typeof item?.label === 'string'
    ))
);

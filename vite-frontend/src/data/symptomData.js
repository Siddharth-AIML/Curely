// A simplified dataset mapping symptoms to potential diseases and doctor specializations.
// In a real-world application, this would be a much more complex dataset or an API call to a medical knowledge base.

export const symptomData = {
    // Common Cold / Flu
    'Fever': { disease: 'Common Cold / Flu', specialization: 'General Physician' },
    'Cough': { disease: 'Common Cold / Flu', specialization: 'General Physician' },
    'Headache': { disease: 'Common Cold / Flu', specialization: 'Neurology' },
    'Runny Nose': { disease: 'Common Cold / Flu', specialization: 'General Physician' },
    'Sore Throat': { disease: 'Common Cold / Flu', specialization: 'General Physician' },
    'Body Aches': { disease: 'Common Cold / Flu', specialization: 'General Physician' },
    'Fatigue': { disease: 'Stress / Anemia', specialization: 'General Physician' },
    'Chills': { disease: 'Common Cold / Flu', specialization: 'General Physician' },

    // Digestive Issues
    'Nausea': { disease: 'Gastrointestinal Issue', specialization: 'Gastroenterology' },
    'Vomiting': { disease: 'Gastrointestinal Issue', specialization: 'Gastroenterology' },
    'Diarrhea': { disease: 'Gastrointestinal Issue', specialization: 'Gastroenterology' },
    'Constipation': { disease: 'Gastrointestinal Issue', specialization: 'Gastroenterology' },
    'Abdominal Pain': { disease: 'Gastrointestinal Issue', specialization: 'Gastroenterology' },
    'Bloating': { disease: 'Gastrointestinal Issue', specialization: 'Gastroenterology' },
    'Heartburn': { disease: 'Acid Reflux / GERD', specialization: 'Gastroenterology' },

    // Skin Issues
    'Rash': { disease: 'Dermatological Issue', specialization: 'Dermatology' },
    'Itching': { disease: 'Dermatological Issue', specialization: 'Dermatology' },
    'Acne': { disease: 'Dermatological Issue', specialization: 'Dermatology' },
    'Hives': { disease: 'Allergy / Dermatological Issue', specialization: 'Dermatology' },
    'Eczema': { disease: 'Dermatological Issue', specialization: 'Dermatology' },

    // Respiratory Issues
    'Shortness of Breath': { disease: 'Respiratory / Cardiac Issue', specialization: 'Pulmonology' },
    'Wheezing': { disease: 'Asthma / Respiratory Issue', specialization: 'Pulmonology' },
    'Chest Pain': { disease: 'Cardiac Issue', specialization: 'Cardiology' },

    // Neurological Issues
    'Dizziness': { disease: 'Neurological / Inner Ear Issue', specialization: 'Neurology' },
    'Migraine': { disease: 'Neurological Issue', specialization: 'Neurology' },
    'Memory Loss': { disease: 'Neurological Issue', specialization: 'Neurology' },
    'Numbness': { disease: 'Neurological Issue', specialization: 'Neurology' },

    // Joint and Muscle Issues
    'Joint Pain': { disease: 'Orthopedic / Rheumatic Issue', specialization: 'Orthopedics' },
    'Muscle Pain': { disease: 'Orthopedic Issue', specialization: 'Orthopedics' },
    'Back Pain': { disease: 'Orthopedic Issue', specialization: 'Orthopedics' },
    'Swelling in Joints': { disease: 'Orthopedic / Rheumatic Issue', specialization: 'Orthopedics' },
};

export const allSymptoms = Object.keys(symptomData);

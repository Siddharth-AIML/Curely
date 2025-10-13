import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import './Questionnaire.css'; // Import the dedicated styles

// This component manages the single-question interaction.
function Questionnaire({ questions, allAnswers, onSubmit, onFinish }) {
    const [rating, setRating] = useState(null);

    // --- Logic to find the current question ---
    const { currentSymptom, currentQuestion, totalQuestions, answeredCount } = useMemo(() => {
        let currentSymptom = null;
        let currentQuestion = null;
        let answeredCount = 0;
        let totalQuestions = 0;

        const allSymptomKeys = Object.keys(questions);
        
        for (const s of allSymptomKeys) {
            const questionList = questions[s];
            totalQuestions += questionList.length;
            
            const answersForSymptom = allAnswers[s] ? Object.keys(allAnswers[s]) : [];
            answeredCount += answersForSymptom.length;

            // Check if we need to ask a question for this symptom
            if (answersForSymptom.length < questionList.length && !currentSymptom) {
                currentSymptom = s;
                currentQuestion = questionList[answersForSymptom.length]; // Get the next unanswered question
            }
        }

        return { currentSymptom, currentQuestion, totalQuestions, answeredCount };
    }, [questions, allAnswers]);


    const handleSubmit = (e) => {
        e.preventDefault();
        // NOTE: We replace alert with a console error/warning to follow React best practices in professional apps.
        if (rating === null || currentSymptom === null || currentQuestion === null) {
            console.warn("Attempted submission without selecting a rating.");
            return;
        }

        // Pass the answer back up to SymptomChecker to update global state and advance
        onSubmit(currentSymptom, currentQuestion, Number(rating));
        
        // Reset local state for the next question
        setRating(null); 
    };

    const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
    const isFinished = answeredCount === totalQuestions;
    
    // Safety check: If all questions are finished, call the finish handler immediately.
    useEffect(() => {
        if (isFinished) {
            // Delay slightly to allow state updates to finish before calling the final prediction API
            const timer = setTimeout(() => {
                 onFinish(allAnswers);
            }, 50); 
            return () => clearTimeout(timer);
        }
    }, [isFinished, allAnswers, onFinish]);


    if (isFinished) {
        // Render loading state while prediction API call runs in SymptomChecker.jsx
        return (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <p className="text-xl font-semibold text-emerald-600">Assessment Complete!</p>
                <p className="text-slate-500">Processing results now...</p>
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        );
    }
    
    // Main Questionnaire UI
    return (
        <form onSubmit={handleSubmit} className="questionnaire-container space-y-6">
            <div className="progress-bar-group">
                <p className="text-sm font-medium text-slate-600 mb-1">
                    Progress: {answeredCount} of {totalQuestions} Questions
                </p>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
            
            <div className="question-card bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="text-md font-bold text-sky-700 capitalize mb-2">
                    Symptom: {currentSymptom}
                </h4>
                <p className="text-lg font-semibold text-slate-800">
                    {currentQuestion}
                </p>
            </div>
            
            <div className="rating-area">
                <h4 className="text-md font-semibold text-slate-700 mb-3">Rate Severity (1 - 5)</h4>
                
                <div className="rating-selector-group">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <label 
                            key={value} 
                            className={`rating-option ${rating === value ? 'selected' : ''}`}
                            onClick={() => setRating(value)}
                        >
                            {value}
                        </label>
                    ))}
                </div>
                
                <div className="rating-scale">
                    <span className="scale-min">1 (Not at all / Mild)</span>
                    <span className="scale-max">5 (Very Severe)</span>
                </div>
            </div>
            
            <button
                type="submit"
                disabled={rating === null}
                className="w-full py-3 px-4 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center gap-2 transition-colors duration-150"
            >
                Continue <ChevronRight size={18} />
            </button>
        </form>
    );
}

export default Questionnaire;
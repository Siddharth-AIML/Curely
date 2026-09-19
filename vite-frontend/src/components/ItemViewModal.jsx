import React, { useState } from 'react';
import { Download, HeartPulse } from 'lucide-react';
import { format } from 'date-fns';
import { downloadItemPdf } from '../utils/downloadPdf.js';
const safeFormat = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'N/A' : format(d, 'MMMM d, yyyy');
};

export default function ItemViewModal({ item, userProfile, onClose, type }) {
    const [downloadError, setDownloadError] = useState('');
    const isPrescription = type === 'Prescription';
    const doctorName = item.doctorId?.name || 'N/A';
    const doctorSpecialization = item.doctorId?.specialization || 'N/A';
    const formattedDate = safeFormat(item.completedAt || item.requestedAt || item.date);
    const reportTitle = item.testName || item.title;

    const handleDownload = () => {
        setDownloadError('');
        try {
            downloadItemPdf({ item, userProfile, type });
        } catch (err) {
            console.error('PDF generation failed:', err);
            setDownloadError('Could not generate the PDF. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <div className="p-4">
                    <header className="flex justify-between items-start pb-4 border-b mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{type} Details</h2>
                            <p className="text-sm text-slate-500">Issued on {formattedDate}</p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <HeartPulse size={24} />
                            <span className="font-bold text-xl">Curely</span>
                        </div>
                    </header>

                    <div className="grid grid-cols-2 gap-6 text-sm mb-6">
                        <div className="space-y-1">
                            <p className="text-slate-500">Patient</p>
                            <p className="font-semibold text-slate-800">{userProfile?.name}</p>
                            <p className="text-slate-600">Med ID: {userProfile?.med_id}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-slate-500">Provider</p>
                            <p className="font-semibold text-slate-800">Dr. {doctorName}</p>
                            <p className="text-slate-600">{doctorSpecialization}</p>
                        </div>
                    </div>

                    {isPrescription ? (
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-2 border-b pb-1">Medicines</h3>
                            <ul className="space-y-3 mt-3">
                                {Array.isArray(item.medicines) && item.medicines.map((med, index) => (
                                    <li key={index} className="text-sm">
                                        <p className="font-bold text-slate-800">
                                            {med.name} <span className="font-medium text-slate-600">({med.dosage})</span>
                                        </p>
                                        <p className="text-slate-600 pl-4">- {med.instructions}</p>
                                    </li>
                                ))}
                            </ul>
                            {item.notes && (
                                <div className="mt-4">
                                    <h3 className="font-semibold text-slate-700 mb-1">Notes</h3>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border">{item.notes}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-2 border-b pb-1">Report: {reportTitle}</h3>
                            <div className="mt-3 space-y-3 text-sm">
                                <p className="font-semibold text-slate-600">Summary:</p>
                                <p className="text-slate-700 whitespace-pre-wrap">{item.summary}</p>
                                {item.fileUrl && (
                                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                                       className="text-emerald-600 font-semibold hover:underline">
                                        View Attached File
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {downloadError && <p className="text-sm text-red-600 px-4">{downloadError}</p>}

                <div className="flex justify-between items-center pt-4 border-t mt-4">
                    <button onClick={onClose} className="text-sm font-semibold text-slate-600 hover:text-slate-800">
                        Close
                    </button>
                    <button onClick={handleDownload}
                        className="flex items-center gap-2 text-sm py-2 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
                        <Download size={16} /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
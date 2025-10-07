import React from 'react';

const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export default StatCard;
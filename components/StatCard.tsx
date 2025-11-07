
import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, className }) => {
  return (
    <div className={`bg-white dark:bg-slate-800/50 p-4 rounded-lg text-center border border-gray-200 dark:border-slate-700 ${className}`}>
      <p className="text-sm text-gray-600 dark:text-slate-400">{label}</p>
      <p className="text-xl md:text-2xl font-semibold text-brand-600 dark:text-brand-400">{value}</p>
    </div>
  );
};

export default StatCard;

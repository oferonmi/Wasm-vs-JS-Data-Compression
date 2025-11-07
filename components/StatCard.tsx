
import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, className }) => {
  return (
    <div className={`bg-slate-800/50 p-4 rounded-lg text-center ${className}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-xl md:text-2xl font-semibold text-cyan-300">{value}</p>
    </div>
  );
};

export default StatCard;

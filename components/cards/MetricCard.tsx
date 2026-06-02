'use client';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
}

export default function MetricCard({ title, value, unit }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-indigo-600">{value}</p>
        {unit && <p className="text-gray-600 text-sm">{unit}</p>}
      </div>
    </div>
  );
}

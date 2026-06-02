'use client';

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BenchmarkDistributionProps {
  data: any[];
}

const COLORS: { [key: string]: string } = {
  below: '#ef4444',
  at: '#f59e0b',
  above: '#10b981',
};

export default function BenchmarkDistribution({ data }: BenchmarkDistributionProps) {
  const chartData = Array.isArray(data) ? data.map((item) => ({
    name: item.benchmark_status?.charAt(0).toUpperCase() + item.benchmark_status?.slice(1) || 'Unknown',
    value: item.count,
    status: item.benchmark_status,
  })) : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Benchmark Distribution</h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.status] || '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${value} assessments`, 'Count']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center py-8">No data available</p>
      )}
    </div>
  );
}

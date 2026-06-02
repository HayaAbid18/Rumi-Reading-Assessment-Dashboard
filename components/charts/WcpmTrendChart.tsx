'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface WcpmTrendChartProps {
  data: any[];
}

export default function WcpmTrendChart({ data }: WcpmTrendChartProps) {
  const chartData = Array.isArray(data) ? data : [];
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">WCPM Trend (Weekly)</h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip
              formatter={(value: any) => [`${parseFloat(value).toFixed(1)} WCPM`, 'Avg']}
              labelFormatter={(label) => `Week of ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avg_wcpm"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ fill: '#4f46e5', r: 4 }}
              activeDot={{ r: 6 }}
              name="Average WCPM"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center py-8">No data available</p>
      )}
    </div>
  );
}

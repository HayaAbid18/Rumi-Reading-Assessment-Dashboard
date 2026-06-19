'use client';

interface CohortData {
  cohort_week: string;
  cohort_size: number;
  week0_pct: number;
  week1_pct: number;
  week2_pct: number;
  week4_pct: number;
}

interface RetentionHeatmapProps {
  title: string;
  data: CohortData[];
}

export default function RetentionHeatmap({ title, data }: RetentionHeatmapProps) {
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-600';
    if (value >= 60) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    if (value >= 20) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const getTextColor = (value: number) => {
    return value >= 40 ? 'text-white' : 'text-gray-900';
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="bg-gray-100 px-3 py-2 text-left font-semibold text-gray-700 border border-gray-200">
                Cohort Week
              </th>
              <th className="bg-gray-100 px-3 py-2 text-center font-semibold text-gray-700 border border-gray-200">
                Size
              </th>
              <th className="bg-gray-100 px-3 py-2 text-center font-semibold text-gray-700 border border-gray-200">
                Week 0
              </th>
              <th className="bg-gray-100 px-3 py-2 text-center font-semibold text-gray-700 border border-gray-200">
                Week 1
              </th>
              <th className="bg-gray-100 px-3 py-2 text-center font-semibold text-gray-700 border border-gray-200">
                Week 2
              </th>
              <th className="bg-gray-100 px-3 py-2 text-center font-semibold text-gray-700 border border-gray-200">
                Week 4
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((cohort, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 font-medium text-gray-900 border border-gray-200 bg-white">
                  {new Date(cohort.cohort_week).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-center text-gray-600 border border-gray-200 bg-white">
                  {cohort.cohort_size}
                </td>
                <td className={`px-3 py-2 text-center font-semibold border border-gray-200 ${getColor(cohort.week0_pct)} ${getTextColor(cohort.week0_pct)}`}>
                  {cohort.week0_pct}%
                </td>
                <td className={`px-3 py-2 text-center font-semibold border border-gray-200 ${getColor(cohort.week1_pct)} ${getTextColor(cohort.week1_pct)}`}>
                  {cohort.week1_pct}%
                </td>
                <td className={`px-3 py-2 text-center font-semibold border border-gray-200 ${getColor(cohort.week2_pct)} ${getTextColor(cohort.week2_pct)}`}>
                  {cohort.week2_pct}%
                </td>
                <td className={`px-3 py-2 text-center font-semibold border border-gray-200 ${getColor(cohort.week4_pct)} ${getTextColor(cohort.week4_pct)}`}>
                  {cohort.week4_pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span>80%+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>60-79%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>40-59%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>20-39%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span>&lt;20%</span>
        </div>
      </div>
    </div>
  );
}

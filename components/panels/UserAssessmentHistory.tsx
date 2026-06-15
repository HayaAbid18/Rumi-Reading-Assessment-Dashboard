'use client';

import { useEffect, useState } from 'react';

interface Assessment {
  id: number;
  wcpm: number;
  accuracy_percentage: number;
  comprehension_score: number;
  on_track: boolean;
  created_at: string;
  grade_level: number;
  passage_type: string;
  language: string;
  teacher_name: string;
  school_name: string;
  duration_minutes: number;
}

interface Summary {
  student_identifier: string;
  total_assessments: number;
  avg_wcpm: number;
  avg_accuracy: number;
  on_track_count: number;
  first_assessment: string;
  last_assessment: string;
  days_since_last: number | null;
}

interface UserAssessmentHistoryProps {
  studentIdentifier: string;
  onBack: () => void;
}

export default function UserAssessmentHistory({
  studentIdentifier,
  onBack
}: UserAssessmentHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/retention/user-history?student_identifier=${studentIdentifier}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch history');
        }

        setSummary(data.summary);
        setAssessments(data.assessments);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentIdentifier]);

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading assessment history...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;
  }

  if (!summary) {
    return <div className="text-center text-gray-400 py-8">No data found</div>;
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Back"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{summary.student_identifier}</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Total Tests</p>
          <p className="text-2xl font-bold text-blue-900">{summary.total_assessments}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 font-medium">On Track</p>
          <p className="text-2xl font-bold text-green-900">{summary.on_track_count}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-purple-600 font-medium">Avg WCPM</p>
          <p className="text-2xl font-bold text-purple-900">{summary.avg_wcpm}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-orange-600 font-medium">Avg Accuracy</p>
          <p className="text-2xl font-bold text-orange-900">{summary.avg_accuracy}%</p>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">First Assessment:</span>
          <span className="font-medium text-gray-900">{new Date(summary.first_assessment!).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Last Assessment:</span>
          <span className="font-medium text-gray-900">
            {new Date(summary.last_assessment!).toLocaleDateString()}
            {summary.days_since_last !== null && (
              <span className="text-gray-500 ml-2">({summary.days_since_last} days ago)</span>
            )}
          </span>
        </div>
      </div>

      {/* Assessments Table */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">All Assessments</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-2 font-semibold text-gray-700">Date</th>
              <th className="text-left py-2 px-2 font-semibold text-gray-700">Language</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">WCPM</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">Accuracy</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">Comp</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">On Track</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-2 px-2 text-gray-900">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="py-2 px-2 text-gray-700 text-xs">{a.language}</td>
                <td className="py-2 px-2 text-center text-gray-700 font-medium">{a.wcpm}</td>
                <td className="py-2 px-2 text-center text-gray-700">{a.accuracy_percentage}%</td>
                <td className="py-2 px-2 text-center text-gray-700">{a.comprehension_score}%</td>
                <td className="py-2 px-2 text-center">
                  <span className={`text-xs font-semibold ${a.on_track ? 'text-green-600' : 'text-red-600'}`}>
                    {a.on_track ? '✓' : '✗'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import UserAssessmentHistory from './UserAssessmentHistory';

interface Student {
  student_identifier: string;
  total_assessments: number;
  avg_wcpm: number;
  avg_accuracy: number;
  on_track_pct?: number;
  on_track_count?: number;
  last_assessment: string;
}

interface MetricContributorsListProps {
  metric: string;
  title: string;
  students: Student[];
  onSelectStudent: (studentId: string) => void;
}

export default function MetricContributorsList({
  metric,
  title,
  students,
  onSelectStudent
}: MetricContributorsListProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  if (selectedStudent) {
    return (
      <UserAssessmentHistory
        studentIdentifier={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  const getMetricColumn = () => {
    switch (metric) {
      case 'wcpm':
        return { label: 'Avg WCPM', key: 'avg_wcpm' };
      case 'accuracy':
        return { label: 'Avg Accuracy', key: 'avg_accuracy' };
      case 'on_track':
        return { label: 'On Track %', key: 'on_track_pct' };
      default:
        return { label: 'Metric', key: 'avg_wcpm' };
    }
  };

  const metricCol = getMetricColumn();

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-900">
          {title}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          {students.length} students
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Student ID</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Tests</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Avg WCPM</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Accuracy</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">{metricCol.label}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, idx) => (
            <tr
              key={idx}
              onClick={() => setSelectedStudent(student.student_identifier)}
              className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <td className="py-3 px-2 font-medium text-gray-900">{student.student_identifier}</td>
              <td className="py-3 px-2 text-center text-gray-600">{student.total_assessments}</td>
              <td className="py-3 px-2 text-center text-gray-600">{student.avg_wcpm}</td>
              <td className="py-3 px-2 text-center text-gray-600">{student.avg_accuracy}%</td>
              <td className="py-3 px-2 text-center font-semibold text-blue-600">
                {(student as any)[metricCol.key]}
                {metric === 'on_track' ? '%' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

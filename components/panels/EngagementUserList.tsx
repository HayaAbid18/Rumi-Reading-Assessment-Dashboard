'use client';

import { useState } from 'react';
import UserAssessmentHistory from './UserAssessmentHistory';

interface Student {
  student_identifier: string;
  total_assessments: number;
  avg_wcpm: number;
  avg_accuracy: number;
  active_days?: number;
  assessments_today?: number;
  distinct_days?: number;
  on_track_count?: number;
}

interface EngagementUserListProps {
  title: string;
  metric: string;
  students: Student[];
  onSelectStudent: (studentId: string) => void;
}

export default function EngagementUserList({
  title,
  metric,
  students,
  onSelectStudent
}: EngagementUserListProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  if (selectedStudent) {
    return (
      <UserAssessmentHistory
        studentIdentifier={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-900">
          {title}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          {students.length} students · {metric}
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Student ID</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Assessments</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Avg WCPM</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Accuracy</th>
            {metric.includes('daily') && (
              <th className="text-center py-3 px-2 font-semibold text-gray-700">On Track</th>
            )}
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
              <td className="py-3 px-2 text-center text-gray-600">
                {student.assessments_today ?? student.total_assessments}
              </td>
              <td className="py-3 px-2 text-center text-gray-600">{student.avg_wcpm}</td>
              <td className="py-3 px-2 text-center text-gray-600">{student.avg_accuracy}%</td>
              {metric.includes('daily') && (
                <td className="py-3 px-2 text-center">
                  <span className={`text-xs font-semibold ${student.on_track_count ? 'text-green-600' : 'text-gray-600'}`}>
                    {student.on_track_count || 0}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

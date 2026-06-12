'use client';

import { useState } from 'react';
import UserAssessmentHistory from './UserAssessmentHistory';

interface Student {
  student_identifier: string;
  total_assessments: number;
  last_active_date: string;
  avg_wcpm: number;
  avg_accuracy: number;
  status: 'active' | 'at-risk' | 'churned';
}

interface CohortMemberListProps {
  cohortWeek: string;
  students: Student[];
  onSelectStudent: (studentId: string) => void;
}

export default function CohortMemberList({
  cohortWeek,
  students,
  onSelectStudent
}: CohortMemberListProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  if (selectedStudent) {
    return (
      <UserAssessmentHistory
        studentIdentifier={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">Active</span>;
      case 'at-risk':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">At-risk</span>;
      case 'churned':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-700">Churned</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-900">
          Cohort: {new Date(cohortWeek).toLocaleDateString()}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          {students.length} students in this cohort
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Student ID</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Tests</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Avg WCPM</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Accuracy</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
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
              <td className="py-3 px-2 text-center">{getStatusBadge(student.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useState } from 'react';
import UserAssessmentHistory from './UserAssessmentHistory';

interface Teacher {
  teacher_id: string;
  teacher_name: string;
  school_name: string;
  total_assessments: number;
  unique_students: number;
  avg_wcpm: number;
  avg_accuracy: number;
  on_track_count: number;
  pct_on_track: number;
}

interface Student {
  student_identifier: string;
  total_assessments: number;
  avg_wcpm: number;
  avg_accuracy: number;
  language: string;
  on_track_count: number;
  last_assessment: string;
}

interface TeacherDetailProps {
  teacherName: string;
  onBack: () => void;
}

export default function TeacherDetail({ teacherName, onBack }: TeacherDetailProps) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useState(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/teachers/detail?teacher_name=${encodeURIComponent(teacherName)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);
        setTeacher(data.teacher);
        setStudents(data.students || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  });

  if (selectedStudent) {
    return (
      <UserAssessmentHistory
        studentIdentifier={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading teacher details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;
  }

  if (!teacher) {
    return <div className="text-center text-gray-400 py-8">Teacher not found</div>;
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{teacher.teacher_name}</h3>
          <p className="text-xs text-gray-500">{teacher.school_name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Total Assessments</p>
          <p className="text-2xl font-bold text-blue-900">{teacher.total_assessments}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Unique Students</p>
          <p className="text-2xl font-bold text-green-900">{teacher.unique_students}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-purple-600 font-medium">Avg Student WCPM</p>
          <p className="text-2xl font-bold text-purple-900">{teacher.avg_wcpm}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-orange-600 font-medium">On Track %</p>
          <p className="text-2xl font-bold text-orange-900">{teacher.pct_on_track}%</p>
        </div>
      </div>

      {/* Students Taught */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Students Taught</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-2 font-semibold text-gray-700">Student ID</th>
              <th className="text-left py-2 px-2 font-semibold text-gray-700">Language</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">Tests</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">Avg WCPM</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedStudent(s.student_identifier)}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <td className="py-2 px-2 text-gray-900 font-medium">{s.student_identifier}</td>
                <td className="py-2 px-2 text-gray-600">{s.language || '—'}</td>
                <td className="py-2 px-2 text-center text-gray-700">{s.total_assessments}</td>
                <td className="py-2 px-2 text-center text-gray-700 font-medium">{s.avg_wcpm}</td>
                <td className="py-2 px-2 text-center text-gray-700">{s.avg_accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

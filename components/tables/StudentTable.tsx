'use client';

import { useEffect, useState } from 'react';

interface StudentRecord {
  id: string;
  created_at: string;
  language: string;
  grade_level: number;
  passage_type: string;
  wcpm: number;
  comprehension_score: number;
  teacher_name: string;
  school_name: string;
}

interface StudentTableProps {
  region: string;
}

export default function StudentTable({ region }: StudentTableProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [region]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?region=${region}`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Individual Reading Assessments</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">School</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Language</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Passage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">WCPM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Comprehension</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No assessments found
                </td>
              </tr>
            ) : (
              students.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">{record.teacher_name}</td>
                  <td className="px-6 py-4 text-gray-600">{record.school_name}</td>
                  <td className="px-6 py-4 text-gray-900">{record.grade_level}</td>
                  <td className="px-6 py-4 text-gray-600">{record.language?.toUpperCase()}</td>
                  <td className="px-6 py-4 text-gray-600">{record.passage_type}</td>
                  <td className="px-6 py-4 text-gray-900 font-bold text-indigo-600">{record.wcpm?.toFixed(1)}</td>
                  <td className="px-6 py-4 text-gray-600">{record.comprehension_score || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {new Date(record.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface Teacher {
  id: string;
  phone_number: string;
  teacher_name: string;
  school_name: string;
  assessments_count: number;
  avg_wcpm: number;
  pct_on_track: number;
  last_assessment: string;
}

interface TeacherTableProps {
  region: string;
}

export default function TeacherTable({ region }: TeacherTableProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, [region]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teachers?region=${region}`);
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Teacher Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">School</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assessments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Avg WCPM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">On Track %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Last Assessment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No teachers found
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{teacher.teacher_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{teacher.school_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{teacher.assessments_count}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium text-indigo-600">
                    {teacher.avg_wcpm ? parseFloat(String(teacher.avg_wcpm)).toFixed(1) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${Math.min(teacher.pct_on_track || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium">{teacher.pct_on_track ? parseFloat(String(teacher.pct_on_track)).toFixed(1) : 'N/A'}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {teacher.last_assessment ? new Date(teacher.last_assessment).toLocaleDateString() : 'N/A'}
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

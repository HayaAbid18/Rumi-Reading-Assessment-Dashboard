'use client';

import { useEffect, useState } from 'react';

interface School {
  school_name: string;
  teachers_count: number;
  assessments_count: number;
  avg_wcpm: number;
  avg_comprehension: number;
}

interface SchoolTableProps {
  region: string;
}

export default function SchoolTable({ region }: SchoolTableProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, [region]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schools?region=${region}`);
      const data = await res.json();
      setSchools(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">School Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">School</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Teachers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assessments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Avg WCPM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Comprehension</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : schools.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No schools found
                </td>
              </tr>
            ) : (
              schools.map((school, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{school.school_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{school.teachers_count}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{school.assessments_count}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium text-indigo-600">
                    {school.avg_wcpm ? parseFloat(String(school.avg_wcpm)).toFixed(1) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {school.avg_comprehension ? parseFloat(String(school.avg_comprehension)).toFixed(1) : 'N/A'}
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

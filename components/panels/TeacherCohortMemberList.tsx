'use client';

interface Teacher {
  teacher_id: number;
  teacher_name: string;
  school_name: string;
  total_assessments: number;
  unique_students: number;
  avg_wcpm: number;
  avg_accuracy: number;
  status: 'active' | 'at-risk' | 'churned';
}

interface TeacherCohortMemberListProps {
  cohortWeek: string;
  teachers: Teacher[];
}

export default function TeacherCohortMemberList({
  cohortWeek,
  teachers
}: TeacherCohortMemberListProps) {
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
      <div className="mb-4 p-4 bg-purple-50 rounded-lg">
        <p className="text-sm font-medium text-purple-900">
          Cohort: {new Date(cohortWeek).toLocaleDateString()}
        </p>
        <p className="text-xs text-purple-700 mt-1">
          {teachers.length} teachers in this cohort
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-semibold text-gray-700">Teacher Name</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-700">School</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Tests</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Students</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Avg WCPM</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Accuracy</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-100 hover:bg-purple-50 transition-colors"
            >
              <td className="py-3 px-2 font-medium text-gray-900">{teacher.teacher_name}</td>
              <td className="py-3 px-2 text-gray-600 text-xs">{teacher.school_name}</td>
              <td className="py-3 px-2 text-center text-gray-600">{teacher.total_assessments}</td>
              <td className="py-3 px-2 text-center text-gray-600">{teacher.unique_students}</td>
              <td className="py-3 px-2 text-center text-gray-600">{teacher.avg_wcpm}</td>
              <td className="py-3 px-2 text-center text-gray-600">{teacher.avg_accuracy}%</td>
              <td className="py-3 px-2 text-center">{getStatusBadge(teacher.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

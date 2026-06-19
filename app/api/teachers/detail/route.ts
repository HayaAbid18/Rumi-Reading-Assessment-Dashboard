import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const teacherId = request.nextUrl.searchParams.get('teacher_id');
  const teacherName = request.nextUrl.searchParams.get('teacher_name');

  try {
    if (!teacherId && !teacherName) {
      return NextResponse.json(
        { error: 'teacher_id or teacher_name parameter is required' },
        { status: 400 }
      );
    }

    // Get teacher detail and their students
    const teacherRes = await pool.query(
      `SELECT
        u.id as teacher_id,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as teacher_name,
        u.school_name,
        COUNT(DISTINCT ra.id) as total_assessments,
        COUNT(DISTINCT ra.student_identifier) as unique_students,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        COUNT(CASE WHEN ra.on_track THEN 1 END) as on_track_count,
        ROUND(100.0 * COUNT(CASE WHEN ra.on_track THEN 1 END) / NULLIF(COUNT(*), 0), 1) as pct_on_track
      FROM users u
      LEFT JOIN reading_assessments ra ON ra.user_id = u.id AND ra.status = 'completed'
      WHERE ${teacherId ? 'u.id = $1' : "COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') = $1"}
      GROUP BY u.id, u.first_name, u.last_name, u.school_name`,
      [teacherId || teacherName]
    );

    if (teacherRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    const teacher = teacherRes.rows[0];

    // Get students this teacher has assessed
    const studentsRes = await pool.query(
      `SELECT
        ra.student_identifier,
        COUNT(DISTINCT ra.id) as total_assessments,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        MAX(ra.language) as language,
        COUNT(CASE WHEN ra.on_track THEN 1 END) as on_track_count,
        MAX(ra.created_at) as last_assessment
      FROM reading_assessments ra
      WHERE ra.user_id = $1 AND ra.status = 'completed'
      GROUP BY ra.student_identifier
      ORDER BY total_assessments DESC`,
      [teacher.teacher_id]
    );

    return NextResponse.json({
      teacher,
      students: studentsRes.rows || []
    });
  } catch (error: any) {
    console.error('Error fetching teacher detail:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch teacher detail',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

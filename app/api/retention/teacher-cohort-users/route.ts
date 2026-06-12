import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const cohortWeek = request.nextUrl.searchParams.get('cohort_week');

  try {
    if (!cohortWeek) {
      return NextResponse.json(
        { error: 'cohort_week parameter is required' },
        { status: 400 }
      );
    }

    // Get all teachers from this cohort with their retention status
    const result = await pool.query(
      `WITH teacher_cohorts AS (
        SELECT
          u.id as teacher_id,
          u.first_name || ' ' || u.last_name as teacher_name,
          u.school_name,
          DATE_TRUNC('week', MIN(ra.created_at))::date as cohort_week
        FROM reading_assessments ra
        JOIN users u ON ra.user_id = u.id
        WHERE ra.status = 'completed' AND u.role = 'teacher'
        GROUP BY u.id, u.first_name, u.last_name, u.school_name
      )
      SELECT
        tc.teacher_id,
        tc.teacher_name,
        tc.school_name,
        COUNT(DISTINCT ra.id) as total_assessments,
        COUNT(DISTINCT ra.student_identifier) as unique_students,
        MAX(ra.created_at) as last_active_date,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        CASE
          WHEN MAX(ra.created_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 'active'
          WHEN MAX(ra.created_at) >= CURRENT_DATE - INTERVAL '14 days' THEN 'at-risk'
          ELSE 'churned'
        END as status
      FROM teacher_cohorts tc
      LEFT JOIN reading_assessments ra ON ra.user_id = tc.teacher_id AND ra.status = 'completed'
      WHERE tc.cohort_week = $1::date
      GROUP BY tc.teacher_id, tc.teacher_name, tc.school_name
      ORDER BY total_assessments DESC`,
      [cohortWeek]
    );

    return NextResponse.json({
      cohort_week: cohortWeek,
      teacher_count: result.rows.length,
      teachers: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching teacher cohort users:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch teacher cohort users',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

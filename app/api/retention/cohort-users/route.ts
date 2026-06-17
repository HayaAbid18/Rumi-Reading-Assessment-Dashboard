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

    // Get all students from this cohort with their retention status
    const result = await pool.query(
      `WITH student_cohorts AS (
        SELECT
          ra.student_identifier,
          DATE_TRUNC('week', MIN(ra.created_at))::date as cohort_week
        FROM reading_assessments ra
        WHERE ra.status = 'completed'
        GROUP BY ra.student_identifier
      ),
      weekly_activity AS (
        SELECT
          ra.student_identifier,
          DATE_TRUNC('week', ra.created_at)::date as active_week
        FROM reading_assessments ra
        WHERE ra.status = 'completed'
        GROUP BY ra.student_identifier, DATE_TRUNC('week', ra.created_at)
      )
      SELECT
        sc.student_identifier,
        COUNT(DISTINCT ra.id) as total_assessments,
        MAX(ra.created_at) as last_active_date,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        MAX(ra.language) as language,
        CASE
          WHEN MAX(ra.created_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 'active'
          WHEN MAX(ra.created_at) >= CURRENT_DATE - INTERVAL '14 days' THEN 'at-risk'
          ELSE 'churned'
        END as status
      FROM student_cohorts sc
      JOIN reading_assessments ra ON ra.student_identifier = sc.student_identifier
      LEFT JOIN weekly_activity wa ON wa.student_identifier = sc.student_identifier
      WHERE sc.cohort_week = $1::date
      GROUP BY sc.student_identifier
      ORDER BY total_assessments DESC`,
      [cohortWeek]
    );

    return NextResponse.json({
      cohort_week: cohortWeek,
      student_count: result.rows.length,
      students: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching cohort users:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cohort users',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

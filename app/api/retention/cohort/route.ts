import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');
  const school = request.nextUrl.searchParams.get('school');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');

  try {
    // Build filter conditions for cohort start date
    const filters: string[] = ["ra.status = 'completed'", "COALESCE(u.is_test_user, false) = false"];
    const params: any[] = [];

    if (region && region !== 'All') {
      if (region === 'International') {
        filters.push("(u.region IS NULL OR u.region = '')");
      } else {
        filters.push(`u.region = $${params.length + 1}`);
        params.push(region);
      }
    }

    if (school && school !== 'All') {
      filters.push(`u.school_name = $${params.length + 1}`);
      params.push(school);
    }

    // Get cohort data - students by their first active week
    const cohortResult = await pool.query(
      `WITH student_cohorts AS (
        SELECT
          ra.student_identifier,
          DATE_TRUNC('week', MIN(ra.created_at))::date as cohort_week,
          COUNT(DISTINCT DATE(ra.created_at)) as active_days_week0
        FROM reading_assessments ra
        JOIN users u ON ra.user_id = u.id
        WHERE ${filters.join(' AND ')}
        GROUP BY ra.student_identifier, DATE_TRUNC('week', MIN(ra.created_at))
      ),
      weekly_activity AS (
        SELECT
          ra.student_identifier,
          DATE_TRUNC('week', ra.created_at)::date as active_week
        FROM reading_assessments ra
        JOIN users u ON ra.user_id = u.id
        WHERE ${filters.join(' AND ')}
        GROUP BY ra.student_identifier, DATE_TRUNC('week', ra.created_at)
      )
      SELECT
        sc.cohort_week,
        COUNT(DISTINCT sc.student_identifier) as cohort_size,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week THEN sc.student_identifier END) as week0_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week + INTERVAL '7 days' THEN sc.student_identifier END) as week1_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week + INTERVAL '14 days' THEN sc.student_identifier END) as week2_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week + INTERVAL '28 days' THEN sc.student_identifier END) as week4_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week + INTERVAL '56 days' THEN sc.student_identifier END) as week8_active
      FROM student_cohorts sc
      LEFT JOIN weekly_activity wa ON wa.student_identifier = sc.student_identifier
      GROUP BY sc.cohort_week
      ORDER BY sc.cohort_week DESC
      LIMIT 12`,
      params
    );

    // Format response with retention percentages
    const cohorts = cohortResult.rows.map((row: any) => ({
      cohort_week: row.cohort_week,
      cohort_size: parseInt(row.cohort_size),
      week0_pct: 100,
      week1_pct: row.cohort_size > 0 ? Math.round((row.week1_active / row.cohort_size) * 100) : 0,
      week2_pct: row.cohort_size > 0 ? Math.round((row.week2_active / row.cohort_size) * 100) : 0,
      week4_pct: row.cohort_size > 0 ? Math.round((row.week4_active / row.cohort_size) * 100) : 0,
      week8_pct: row.cohort_size > 0 ? Math.round((row.week8_active / row.cohort_size) * 100) : 0,
    }));

    return NextResponse.json({
      cohorts: cohorts
    });
  } catch (error: any) {
    console.error('Error fetching cohort retention:', error);
    return NextResponse.json({
      error: 'Failed to fetch cohort retention',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

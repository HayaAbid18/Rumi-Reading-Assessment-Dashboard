import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Simplified cohort retention queries (no date filters needed for cohort analysis)
    // Simple student cohort retention query
    const studentCohortResult = await pool.query(
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
        sc.cohort_week,
        COUNT(DISTINCT sc.student_identifier) as cohort_size,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week THEN sc.student_identifier END) as week0_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week + INTERVAL '7 days' THEN sc.student_identifier END) as week1_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week + INTERVAL '14 days' THEN sc.student_identifier END) as week2_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = sc.cohort_week + INTERVAL '28 days' THEN sc.student_identifier END) as week4_active
      FROM student_cohorts sc
      LEFT JOIN weekly_activity wa ON wa.student_identifier = sc.student_identifier
      GROUP BY sc.cohort_week
      ORDER BY sc.cohort_week DESC
      LIMIT 12`
    );

    const studentCohorts = studentCohortResult.rows.map((row: any) => ({
      cohort_week: row.cohort_week,
      cohort_size: parseInt(row.cohort_size),
      week0_pct: 100,
      week1_pct: row.cohort_size > 0 ? Math.round((row.week1_active / row.cohort_size) * 100) : 0,
      week2_pct: row.cohort_size > 0 ? Math.round((row.week2_active / row.cohort_size) * 100) : 0,
      week4_pct: row.cohort_size > 0 ? Math.round((row.week4_active / row.cohort_size) * 100) : 0,
    }));

    // Simple teacher cohort retention query
    const teacherCohortResult = await pool.query(
      `WITH teacher_cohorts AS (
        SELECT
          ra.user_id,
          DATE_TRUNC('week', MIN(ra.created_at))::date as cohort_week
        FROM reading_assessments ra
        WHERE ra.status = 'completed'
        GROUP BY ra.user_id
      ),
      weekly_activity AS (
        SELECT
          ra.user_id,
          DATE_TRUNC('week', ra.created_at)::date as active_week
        FROM reading_assessments ra
        WHERE ra.status = 'completed'
        GROUP BY ra.user_id, DATE_TRUNC('week', ra.created_at)
      )
      SELECT
        tc.cohort_week,
        COUNT(DISTINCT tc.user_id) as cohort_size,
        COUNT(DISTINCT CASE WHEN wa.active_week = tc.cohort_week THEN tc.user_id END) as week0_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = tc.cohort_week + INTERVAL '7 days' THEN tc.user_id END) as week1_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = tc.cohort_week + INTERVAL '14 days' THEN tc.user_id END) as week2_active,
        COUNT(DISTINCT CASE WHEN wa.active_week = tc.cohort_week + INTERVAL '28 days' THEN tc.user_id END) as week4_active
      FROM teacher_cohorts tc
      LEFT JOIN weekly_activity wa ON wa.user_id = tc.user_id
      GROUP BY tc.cohort_week
      ORDER BY tc.cohort_week DESC
      LIMIT 12`
    );

    const teacherCohorts = teacherCohortResult.rows.map((row: any) => ({
      cohort_week: row.cohort_week,
      cohort_size: parseInt(row.cohort_size),
      week0_pct: 100,
      week1_pct: row.cohort_size > 0 ? Math.round((row.week1_active / row.cohort_size) * 100) : 0,
      week2_pct: row.cohort_size > 0 ? Math.round((row.week2_active / row.cohort_size) * 100) : 0,
      week4_pct: row.cohort_size > 0 ? Math.round((row.week4_active / row.cohort_size) * 100) : 0,
    }));

    // Repeat rate
    const repeatRateResult = await pool.query(
      `SELECT
        COUNT(DISTINCT CASE WHEN assessment_count > 1 THEN student_identifier END)::float /
        COUNT(DISTINCT student_identifier) * 100 as repeat_rate,
        COUNT(DISTINCT CASE WHEN assessment_count > 1 THEN student_identifier END) as repeat_students,
        COUNT(DISTINCT student_identifier) as total_students
      FROM (
        SELECT ra.student_identifier, COUNT(*) as assessment_count
        FROM reading_assessments ra
        WHERE ra.status = 'completed'
        GROUP BY ra.student_identifier
      ) subq`
    );

    return NextResponse.json({
      student_cohorts: studentCohorts,
      teacher_cohorts: teacherCohorts,
      repeat_rate: {
        percentage: Math.round((repeatRateResult.rows[0]?.repeat_rate || 0) * 10) / 10,
        repeat_students: repeatRateResult.rows[0]?.repeat_students || 0,
        total_students: repeatRateResult.rows[0]?.total_students || 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching cohort retention:', error);
    return NextResponse.json({
      error: 'Failed to fetch cohort retention',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

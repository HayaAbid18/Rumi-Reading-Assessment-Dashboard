import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');
  const school = request.nextUrl.searchParams.get('school');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');
  const language = request.nextUrl.searchParams.get('language');
  const excludedUserIdsParam = request.nextUrl.searchParams.get('excludedUserIds');
  const excludedUserIds = excludedUserIdsParam ? excludedUserIdsParam.split(',') : [];

  try {
    // Build filter conditions
    const filters: string[] = ["ra.status = 'completed'"];
    const params: any[] = [];

    if (excludedUserIds.length > 0) {
      filters.push(`ra.user_id NOT IN (${excludedUserIds.map((_, i) => `$${params.length + i + 1}`).join(',')})`);
      params.push(...excludedUserIds);
    }

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

    if (language && language !== 'all') {
      filters.push(`LOWER(ra.language) = $${params.length + 1}`);
      params.push(language.toLowerCase());
    }

    if (startDate && endDate) {
      filters.push(`ra.created_at::date >= $${params.length + 1}`);
      filters.push(`ra.created_at::date <= $${params.length + 2}`);
      params.push(startDate, endDate);
    }

    const baseFilter = `WHERE ${filters.join(' AND ')}`;

    // Current WAU (this week)
    const currentWauResult = await pool.query(
      `SELECT COUNT(DISTINCT ra.student_identifier) as wau
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}
      AND DATE_TRUNC('week', ra.created_at) = DATE_TRUNC('week', CURRENT_DATE)`,
      params
    );

    // WAU - Weekly Active Users (last 4 weeks)
    const wauResult = await pool.query(
      `SELECT
        DATE_TRUNC('week', ra.created_at)::date as week,
        COUNT(DISTINCT ra.student_identifier) as wau
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}
      GROUP BY DATE_TRUNC('week', ra.created_at)
      ORDER BY week DESC
      LIMIT 4`,
      params
    );

    // DAU - Daily Active Users (last 7 days)
    const dauResult = await pool.query(
      `SELECT
        DATE(ra.created_at) as day,
        COUNT(DISTINCT ra.student_identifier) as dau
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}
      AND ra.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(ra.created_at)
      ORDER BY day DESC`,
      params
    );

    // Total assessments
    const totalAssessmentsResult = await pool.query(
      `SELECT
        COUNT(*) as total_assessments,
        COUNT(DISTINCT ra.student_identifier) as total_students
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}`,
      params
    );

    // Repeat rate - students with multiple assessments
    const repeatRateResult = await pool.query(
      `SELECT
        COUNT(DISTINCT CASE WHEN assessment_count > 1 THEN student_identifier END)::float /
        COUNT(DISTINCT student_identifier) * 100 as repeat_rate,
        COUNT(DISTINCT CASE WHEN assessment_count > 1 THEN student_identifier END) as repeat_students
      FROM (
        SELECT ra.student_identifier, COUNT(*) as assessment_count
        FROM reading_assessments ra
        JOIN users u ON ra.user_id = u.id
        ${baseFilter}
        GROUP BY ra.student_identifier
      ) subq`,
      params
    );

    // Assessment frequency - average assessments per student per week
    const frequencyResult = await pool.query(
      `SELECT
        ROUND(AVG(assessment_count::numeric), 2) as avg_assessments_per_student_per_week
      FROM (
        SELECT
          ra.student_identifier,
          DATE_TRUNC('week', ra.created_at)::date as week,
          COUNT(*) as assessment_count
        FROM reading_assessments ra
        JOIN users u ON ra.user_id = u.id
        ${baseFilter}
        GROUP BY ra.student_identifier, DATE_TRUNC('week', ra.created_at)
      ) subq`,
      params
    );

    // Session duration
    const durationResult = await pool.query(
      `SELECT
        ROUND(AVG(ra.time_elapsed_seconds)::numeric, 1) as avg_duration_seconds,
        ROUND((AVG(ra.time_elapsed_seconds)::numeric / 60), 1) as avg_duration_minutes
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}`,
      params
    );

    // Activity by time of day (morning vs afternoon)
    const timeOfDayResult = await pool.query(
      `SELECT
        CASE
          WHEN EXTRACT(HOUR FROM ra.created_at) < 12 THEN 'morning'
          ELSE 'afternoon'
        END as period,
        COUNT(*) as assessments,
        COUNT(DISTINCT ra.student_identifier) as students
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}
      GROUP BY CASE WHEN EXTRACT(HOUR FROM ra.created_at) < 12 THEN 'morning' ELSE 'afternoon' END`,
      params
    );

    return NextResponse.json({
      current_wau: currentWauResult.rows[0]?.wau || 0,
      wau_trend: wauResult.rows || [],
      dau_trend: dauResult.rows || [],
      repeat_rate: {
        percentage: Math.round((repeatRateResult.rows[0]?.repeat_rate || 0) * 10) / 10,
        repeat_students: repeatRateResult.rows[0]?.repeat_students || 0,
        total_students: totalAssessmentsResult.rows[0]?.total_students || 0
      },
      frequency: {
        avg_assessments_per_student_per_week: frequencyResult.rows[0]?.avg_assessments_per_student_per_week || 0
      },
      duration: {
        avg_minutes: durationResult.rows[0]?.avg_duration_minutes || 0,
        avg_seconds: durationResult.rows[0]?.avg_duration_seconds || 0
      },
      time_of_day: timeOfDayResult.rows || [],
      adoption: {
        total_students: totalAssessmentsResult.rows[0]?.total_students || 0
      },
      growth: {
        growth_attempts: 0,
        growth_attempt_pct: 0,
        students_attempting_growth: 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching engagement metrics:', {
      message: error?.message,
      detail: error?.detail
    });
    return NextResponse.json({
      error: 'Failed to fetch engagement metrics',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

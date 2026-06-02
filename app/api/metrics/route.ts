import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');

  try {
    let regionFilter = '';
    const params: any[] = [];

    if (region && region !== 'All') {
      if (region === 'International') {
        regionFilter = ` AND (u.region IS NULL OR u.region = '')`;
      } else {
        regionFilter = ` AND u.region = $1`;
        params.push(region);
      }
    }

    // Performance metrics
    const performanceResult = await pool.query(
      `SELECT
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        ROUND(AVG(ra.comprehension_score)::numeric, 1) as avg_comprehension,
        COUNT(DISTINCT ra.student_identifier) as total_students,
        COUNT(CASE WHEN ra.on_track = true THEN 1 END)::float / COUNT(*) * 100 as pct_on_track
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.status = 'completed'
        AND COALESCE(u.is_test_user, false) = false
        ${regionFilter}`,
      params
    );

    // Completion & engagement metrics
    const completionResult = await pool.query(
      `SELECT
        ROUND(AVG(ra.time_elapsed_seconds)::numeric, 1) as avg_time_seconds,
        COUNT(CASE WHEN ra.current_level_attempt > 1 THEN 1 END)::float / COUNT(*) * 100 as repeat_attempt_rate,
        COUNT(DISTINCT DATE(ra.created_at)) as days_with_assessments,
        COUNT(*) as total_assessments
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.status = 'completed'
        AND COALESCE(u.is_test_user, false) = false
        ${regionFilter}`,
      params
    );

    // Adoption metrics
    const adoptionResult = await pool.query(
      `SELECT
        COUNT(DISTINCT ra.student_identifier) as active_students,
        COUNT(DISTINCT ra.user_id) as active_teachers,
        COUNT(DISTINCT u.school_name) as active_schools
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.status = 'completed'
        AND COALESCE(u.is_test_user, false) = false
        ${regionFilter}`,
      params
    );

    // Weekly trends
    const trendsResult = await pool.query(
      `SELECT
        DATE_TRUNC('week', ra.created_at)::date as week,
        COUNT(*) as tests_taken,
        ROUND(AVG(wcpm)::numeric, 1) as avg_wcpm,
        COUNT(DISTINCT student_identifier) as unique_students
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.status = 'completed'
        AND COALESCE(u.is_test_user, false) = false
        ${regionFilter}
      GROUP BY DATE_TRUNC('week', ra.created_at)
      ORDER BY week DESC
      LIMIT 12`,
      params
    );

    // Score distribution
    const distributionResult = await pool.query(
      `SELECT
        CASE
          WHEN ra.wcpm < 40 THEN 'Below Target'
          WHEN ra.wcpm >= 40 AND ra.wcpm < 60 THEN 'At Target'
          ELSE 'Above Target'
        END as category,
        COUNT(*) as count,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER ()::numeric, 1) as percentage
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.status = 'completed'
        AND COALESCE(u.is_test_user, false) = false
        AND ra.wcpm IS NOT NULL
        ${regionFilter}
      GROUP BY CASE
        WHEN ra.wcpm < 40 THEN 'Below Target'
        WHEN ra.wcpm >= 40 AND ra.wcpm < 60 THEN 'At Target'
        ELSE 'Above Target'
      END`,
      params
    );

    return NextResponse.json({
      performance: performanceResult.rows[0] || {},
      completion: completionResult.rows[0] || {},
      adoption: adoptionResult.rows[0] || {},
      trends: trendsResult.rows || [],
      distribution: distributionResult.rows || []
    });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({
      error: 'Failed to fetch metrics',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

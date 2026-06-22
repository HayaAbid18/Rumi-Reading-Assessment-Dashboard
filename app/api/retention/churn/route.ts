import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');
  const school = request.nextUrl.searchParams.get('school');
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

    const baseFilter = filters.join(' AND ');

    // Get students with their last activity date
    const lastActivityResult = await pool.query(
      `SELECT
        ra.student_identifier,
        MAX(ra.created_at) as last_active_date,
        COUNT(*) as total_assessments,
        COUNT(DISTINCT DATE(ra.created_at)) as active_days
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ${baseFilter}
      GROUP BY ra.student_identifier`,
      params
    );

    // Calculate churn metrics
    const today = new Date();
    let atRiskCount = 0;
    let churnedCount = 0;
    const atRiskUsers = [];

    for (const row of lastActivityResult.rows) {
      const lastActive = new Date(row.last_active_date);
      const daysSinceActive = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceActive >= 14) {
        churnedCount++;
      } else if (daysSinceActive >= 7) {
        atRiskCount++;
        atRiskUsers.push({
          student_identifier: row.student_identifier,
          last_active_date: row.last_active_date,
          days_inactive: daysSinceActive,
          total_assessments: row.total_assessments,
          active_days: row.active_days,
          risk_score: Math.round((daysSinceActive / 14) * 100) / 100
        });
      }
    }

    // Get total active students
    const totalActiveResult = await pool.query(
      `SELECT COUNT(DISTINCT ra.student_identifier) as total_students
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ${baseFilter}`,
      params
    );

    const totalStudents = totalActiveResult.rows[0]?.total_students || 0;

    // Calculate this week's churn rate
    const churnRateResult = await pool.query(
      `WITH prev_week_students AS (
        SELECT DISTINCT ra.student_identifier
        FROM reading_assessments ra
        JOIN users u ON ra.user_id = u.id
        WHERE ${baseFilter}
          AND ra.created_at >= CURRENT_DATE - INTERVAL '14 days'
          AND ra.created_at < CURRENT_DATE - INTERVAL '7 days'
      ),
      current_week_students AS (
        SELECT DISTINCT ra.student_identifier
        FROM reading_assessments ra
        JOIN users u ON ra.user_id = u.id
        WHERE ${baseFilter}
          AND ra.created_at >= CURRENT_DATE - INTERVAL '7 days'
      )
      SELECT
        COUNT(DISTINCT prev.student_identifier) as prev_week_count,
        COUNT(DISTINCT curr.student_identifier) as curr_week_count
      FROM prev_week_students prev
      LEFT JOIN current_week_students curr ON curr.student_identifier = prev.student_identifier`,
      params
    );

    const prevWeekCount = churnRateResult.rows[0]?.prev_week_count || 0;
    const currWeekCount = churnRateResult.rows[0]?.curr_week_count || 0;
    const churnRate = prevWeekCount > 0 ? Math.round(((prevWeekCount - currWeekCount) / prevWeekCount) * 100) / 100 : 0;

    // Sort at-risk users by days inactive (most at-risk first)
    atRiskUsers.sort((a, b) => b.days_inactive - a.days_inactive);

    return NextResponse.json({
      churn_summary: {
        total_active_students: totalStudents,
        at_risk_count: atRiskCount,
        at_risk_pct: totalStudents > 0 ? Math.round((atRiskCount / totalStudents) * 100 * 10) / 10 : 0,
        churned_count: churnedCount,
        churned_pct: totalStudents > 0 ? Math.round((churnedCount / totalStudents) * 100 * 10) / 10 : 0,
        churn_rate_week_over_week: churnRate,
        inactive_threshold_days: 14
      },
      at_risk_users: atRiskUsers.slice(0, 50)
    });
  } catch (error: any) {
    console.error('Error fetching churn data:', error);
    return NextResponse.json({
      error: 'Failed to fetch churn data',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');
  const school = request.nextUrl.searchParams.get('school');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');
  const metric = request.nextUrl.searchParams.get('metric');

  try {
    if (!metric) {
      return NextResponse.json(
        { error: 'metric parameter is required (wcpm|accuracy|on_track)' },
        { status: 400 }
      );
    }

    // Build filter conditions
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

    if (startDate && endDate) {
      filters.push(`ra.created_at::date >= $${params.length + 1}`);
      filters.push(`ra.created_at::date <= $${params.length + 2}`);
      params.push(startDate, endDate);
    }

    const baseFilter = `WHERE ${filters.join(' AND ')}`;

    // Get students by metric (sorted by metric value)
    let orderByClause = 'ORDER BY avg_wcpm DESC';
    let selectMetric = 'ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm';

    if (metric === 'accuracy') {
      orderByClause = 'ORDER BY avg_accuracy DESC';
      selectMetric = 'ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy';
    } else if (metric === 'on_track') {
      orderByClause = 'ORDER BY on_track_pct DESC';
      selectMetric = 'ROUND(100.0 * COUNT(CASE WHEN ra.on_track THEN 1 END) / COUNT(*), 1) as on_track_pct';
    }

    const result = await pool.query(
      `SELECT
        ra.student_identifier,
        COUNT(DISTINCT ra.id) as total_assessments,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        ROUND(100.0 * COUNT(CASE WHEN ra.on_track THEN 1 END) / COUNT(*), 1) as on_track_pct,
        MAX(ra.language) as language,
        MAX(ra.created_at) as last_assessment
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}
      GROUP BY ra.student_identifier
      ${orderByClause}
      LIMIT 100`,
      params
    );

    return NextResponse.json({
      metric,
      student_count: result.rows.length,
      students: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching metric contributors:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch metric contributors',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

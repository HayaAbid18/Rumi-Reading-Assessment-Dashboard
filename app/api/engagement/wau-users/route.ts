import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');
  const school = request.nextUrl.searchParams.get('school');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');

  try {
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
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

    filters.push(`ra.created_at::date >= $${params.length + 1}`);
    filters.push(`ra.created_at::date <= $${params.length + 2}`);
    params.push(startDate, endDate);

    const baseFilter = `WHERE ${filters.join(' AND ')}`;

    // Get all students active in this week with their engagement data
    const result = await pool.query(
      `SELECT
        ra.student_identifier,
        COUNT(DISTINCT ra.id) as total_assessments,
        COUNT(DISTINCT DATE(ra.created_at)) as active_days,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        MAX(ra.created_at) as last_active_date,
        COUNT(CASE WHEN ra.on_track THEN 1 END) as on_track_count
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}
      GROUP BY ra.student_identifier
      ORDER BY total_assessments DESC`,
      params
    );

    return NextResponse.json({
      date_range: { start: startDate, end: endDate },
      student_count: result.rows.length,
      students: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching WAU users:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch WAU users',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

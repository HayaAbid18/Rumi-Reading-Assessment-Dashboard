import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');
  const school = request.nextUrl.searchParams.get('school');
  const day = request.nextUrl.searchParams.get('day');

  try {
    if (!day) {
      return NextResponse.json(
        { error: 'day parameter is required' },
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

    params.push(day);
    const dayFilter = `DATE(ra.created_at) = $${params.length}::date`;

    const baseFilter = `WHERE ${filters.join(' AND ')} AND ${dayFilter}`;

    // Get all students active on this day with their engagement data
    const result = await pool.query(
      `SELECT
        ra.student_identifier,
        COUNT(DISTINCT ra.id) as assessments_today,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        COUNT(CASE WHEN ra.on_track THEN 1 END) as on_track_count,
        MIN(ra.created_at) as first_assessment_time,
        MAX(ra.created_at) as last_assessment_time
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}
      GROUP BY ra.student_identifier
      ORDER BY assessments_today DESC`,
      params
    );

    return NextResponse.json({
      day,
      student_count: result.rows.length,
      students: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching DAU users:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch DAU users',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

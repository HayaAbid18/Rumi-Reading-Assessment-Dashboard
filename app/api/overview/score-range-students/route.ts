import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');
  const school = request.nextUrl.searchParams.get('school');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');
  const range = request.nextUrl.searchParams.get('range');

  try {
    if (!range) {
      return NextResponse.json(
        { error: 'range parameter is required (0-20|20-40|40-60|60-80|80-100)' },
        { status: 400 }
      );
    }

    // Parse range
    const [minScore, maxScore] = range.split('-').map(Number);
    if (isNaN(minScore) || isNaN(maxScore)) {
      return NextResponse.json(
        { error: 'Invalid range format' },
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

    filters.push(`ra.accuracy_percentage >= $${params.length + 1}`);
    filters.push(`ra.accuracy_percentage < $${params.length + 2}`);
    params.push(minScore, maxScore);

    const baseFilter = `WHERE ${filters.join(' AND ')}`;

    // Get students in this score range
    const result = await pool.query(
      `SELECT
        ra.student_identifier,
        COUNT(DISTINCT ra.id) as total_assessments,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        COUNT(CASE WHEN ra.on_track THEN 1 END) as on_track_count,
        MAX(ra.created_at) as last_assessment
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      ${baseFilter}
      GROUP BY ra.student_identifier
      ORDER BY avg_accuracy DESC
      LIMIT 100`,
      params
    );

    return NextResponse.json({
      score_range: range,
      student_count: result.rows.length,
      students: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching score range students:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch score range students',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get('school');
  const region = request.nextUrl.searchParams.get('region');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');

  try {
    // Build filter conditions
    const filters: string[] = ["COALESCE(u.is_test_user, false) = false", "ra.status = 'completed'"];
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

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const result = await pool.query(
      `SELECT
        u.id,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as teacher_name,
        u.school_name,
        COUNT(DISTINCT ra.id) as assessments_count,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        COUNT(CASE WHEN ra.on_track = true THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as pct_on_track,
        MAX(ra.created_at) as last_assessment
      FROM users u
      LEFT JOIN reading_assessments ra ON u.id = ra.user_id
      ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.school_name
      HAVING COUNT(DISTINCT ra.id) > 0
      ORDER BY COUNT(DISTINCT ra.id) DESC
      LIMIT 100`,
      params
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching teacher metrics:', error);
    return NextResponse.json({
      error: 'Failed to fetch teacher metrics',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get('school');
  const region = request.nextUrl.searchParams.get('region');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');

  try {
    let query = `
      SELECT
        u.id,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as teacher_name,
        u.school_name,
        COUNT(DISTINCT ra.id) as assessments_count,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        ROUND(AVG(ra.accuracy_percentage)::numeric, 1) as avg_accuracy,
        COUNT(CASE WHEN ra.on_track = true THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as pct_on_track,
        MAX(ra.created_at) as last_assessment
      FROM users u
      LEFT JOIN reading_assessments ra ON u.id = ra.user_id AND ra.status = 'completed'
      WHERE COALESCE(u.is_test_user, false) = false
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (region && region !== 'All') {
      if (region === 'International') {
        query += ` AND (u.region IS NULL OR u.region = '')`;
      } else {
        query += ` AND u.region = $${paramCount}`;
        params.push(region);
        paramCount++;
      }
    }

    if (school && school !== 'All') {
      query += ` AND u.school_name = $${paramCount}`;
      params.push(school);
      paramCount++;
    }

    if (startDate && endDate) {
      query += ` AND DATE(ra.created_at) >= $${paramCount} AND DATE(ra.created_at) <= $${paramCount + 1}`;
      params.push(startDate, endDate);
      paramCount += 2;
    }

    query += `
      GROUP BY u.id, u.first_name, u.last_name, u.school_name
      HAVING COUNT(DISTINCT ra.id) > 0
      ORDER BY COUNT(DISTINCT ra.id) DESC
      LIMIT 100
    `;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching teacher metrics:', error);
    return NextResponse.json({
      error: 'Failed to fetch teacher metrics',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');

  try {
    let query = `
      SELECT DISTINCT u.school_name
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE u.school_name IS NOT NULL
        AND COALESCE(u.is_test_user, false) = false
    `;

    const params: any[] = [];

    if (region && region !== 'All') {
      if (region === 'International') {
        query += ` AND (u.region IS NULL OR u.region = '')`;
      } else {
        query += ` AND u.region = $1`;
        params.push(region);
      }
    }

    query += ` ORDER BY u.school_name LIMIT 100`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      schools: result.rows.map((r: any) => r.school_name),
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching schools list:', error);
    return NextResponse.json({
      error: 'Failed to fetch schools',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get('school');
  const region = request.nextUrl.searchParams.get('region');

  try {
    let query = `
      SELECT
        ra.id,
        ra.student_identifier,
        ra.grade_level,
        ra.language,
        ra.passage_type,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as teacher_name,
        u.school_name,
        ra.wcpm,
        ra.accuracy_percentage,
        ra.comprehension_score,
        ra.on_track,
        ra.created_at,
        ra.completed_at,
        EXTRACT(EPOCH FROM (ra.completed_at - ra.created_at))::int as duration_seconds
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.status = 'completed'
        AND COALESCE(u.is_test_user, false) = false
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

    query += ` ORDER BY ra.created_at DESC LIMIT 500`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching student records:', error);
    return NextResponse.json({
      error: 'Failed to fetch student records',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

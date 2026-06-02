import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');
  const teacher = request.nextUrl.searchParams.get('teacher');
  const school = request.nextUrl.searchParams.get('school');

  try {
    let query = `
      SELECT
        ra.id,
        ra.created_at,
        ra.language,
        ra.grade_level,
        ra.passage_type,
        ra.wcpm,
        ra.comprehension_score,
        u.phone_number,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as teacher_name,
        u.school_name
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE COALESCE(u.is_test_user, false) = false
    `;

    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (region && region !== 'All') {
      query += `
        AND CASE
          WHEN u.school_name ILIKE '%islamabad%' THEN 'Islamabad'
          WHEN u.school_name ILIKE '%rawalpindi%' THEN 'Rawalpindi'
          WHEN u.school_name ILIKE '%lahore%' THEN 'Lahore'
          WHEN u.school_name ILIKE '%karachi%' THEN 'Karachi'
          WHEN u.school_name ILIKE '%peshawar%' THEN 'Peshawar'
          WHEN u.school_name ILIKE '%quetta%' THEN 'Quetta'
          WHEN u.school_name ILIKE '%multan%' THEN 'Multan'
          WHEN u.school_name ILIKE '%faisalabad%' THEN 'Faisalabad'
          WHEN u.school_name ILIKE '%colombo%' THEN 'Colombo'
          WHEN u.school_name ILIKE '%kandy%' THEN 'Kandy'
          WHEN u.school_name ILIKE '%galle%' THEN 'Galle'
          ELSE 'Other'
        END = $${paramIndex}
      `;
      params.push(region);
      paramIndex++;
    }

    if (teacher) {
      query += ` AND u.id = $${paramIndex}`;
      params.push(teacher);
      paramIndex++;
    }

    if (school) {
      query += ` AND u.school_name = $${paramIndex}`;
      params.push(school);
      paramIndex++;
    }

    query += ` ORDER BY ra.created_at DESC LIMIT 500`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({
      error: 'Failed to fetch student data',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

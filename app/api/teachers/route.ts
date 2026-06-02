import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');

  try {
    const regionFilter = region && region !== 'All'
      ? `
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
        END = $1
      `
      : '';

    const params = region && region !== 'All' ? [region] : [];

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.phone_number,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as teacher_name,
        u.school_name,
        COUNT(DISTINCT ra.id) as assessments_count,
        ROUND(AVG(CASE WHEN ra.wcpm IS NOT NULL THEN ra.wcpm ELSE NULL END)::numeric, 1) as avg_wcpm,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ra.on_track = true) / NULLIF(COUNT(*), 0)::numeric, 1) as pct_on_track,
        MAX(ra.created_at) as last_assessment
      FROM users u
      LEFT JOIN reading_assessments ra ON u.id = ra.user_id AND ra.status = 'completed'
      WHERE COALESCE(u.is_test_user, false) = false
        ${regionFilter}
      GROUP BY u.id, u.phone_number, u.first_name, u.last_name, u.school_name
      HAVING COUNT(DISTINCT ra.id) > 0
      ORDER BY COUNT(DISTINCT ra.id) DESC
      LIMIT 100
      `,
      params
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher data' }, { status: 500 });
  }
}

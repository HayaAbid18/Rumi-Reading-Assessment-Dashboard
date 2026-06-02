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
        DATE_TRUNC('week', ra.created_at)::date as week,
        ROUND(AVG(ra.wcpm)::numeric, 1) as avg_wcpm,
        COUNT(*) as count
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.status = 'completed'
        AND ra.wcpm IS NOT NULL
        AND COALESCE(u.is_test_user, false) = false
        ${regionFilter}
      GROUP BY DATE_TRUNC('week', ra.created_at)
      ORDER BY week DESC
      LIMIT 26
      `,
      params
    );

    return NextResponse.json(result.rows.reverse());
  } catch (error) {
    console.error('Error fetching WCPM trend:', error);
    return NextResponse.json({ error: 'Failed to fetch trend data' }, { status: 500 });
  }
}

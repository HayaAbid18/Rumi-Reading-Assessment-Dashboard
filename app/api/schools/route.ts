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
        u.school_name,
        COUNT(DISTINCT u.id) as teachers_count,
        COUNT(DISTINCT ra.id) as assessments_count,
        ROUND(AVG(CASE WHEN ra.wcpm IS NOT NULL THEN ra.wcpm ELSE NULL END)::numeric, 1) as avg_wcpm,
        ROUND(AVG(CASE WHEN ra.comprehension_score IS NOT NULL THEN ra.comprehension_score ELSE NULL END)::numeric, 1) as avg_comprehension,
        COUNT(DISTINCT ra.id) as completed_count
      FROM users u
      LEFT JOIN reading_assessments ra ON u.id = ra.user_id AND ra.status = 'completed'
      WHERE COALESCE(u.is_test_user, false) = false
        AND u.school_name IS NOT NULL
        ${regionFilter}
      GROUP BY u.school_name
      HAVING COUNT(DISTINCT ra.id) > 0
      ORDER BY COUNT(DISTINCT ra.id) DESC
      LIMIT 100
      `,
      params
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({
      error: 'Failed to fetch school data',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region');

  try {
    const regionFilter = region && region !== 'All'
      ? `
        AND CASE
          WHEN school_name ILIKE '%islamabad%' THEN 'Islamabad'
          WHEN school_name ILIKE '%rawalpindi%' THEN 'Rawalpindi'
          WHEN school_name ILIKE '%lahore%' THEN 'Lahore'
          WHEN school_name ILIKE '%karachi%' THEN 'Karachi'
          WHEN school_name ILIKE '%peshawar%' THEN 'Peshawar'
          WHEN school_name ILIKE '%quetta%' THEN 'Quetta'
          WHEN school_name ILIKE '%multan%' THEN 'Multan'
          WHEN school_name ILIKE '%faisalabad%' THEN 'Faisalabad'
          WHEN school_name ILIKE '%colombo%' THEN 'Colombo'
          WHEN school_name ILIKE '%kandy%' THEN 'Kandy'
          WHEN school_name ILIKE '%galle%' THEN 'Galle'
          ELSE 'Other'
        END = $1
      `
      : '';

    const params = region && region !== 'All' ? [region] : [];

    const result = await pool.query(
      `
      SELECT
        COUNT(DISTINCT ra.id) as total_assessments,
        COUNT(DISTINCT ra.user_id) as total_teachers,
        COUNT(DISTINCT u.school_name) as total_schools,
        ROUND(AVG(CASE WHEN ra.wcpm IS NOT NULL THEN ra.wcpm ELSE NULL END)::numeric, 1) as avg_wcpm,
        ROUND(AVG(CASE WHEN ra.comprehension_score IS NOT NULL THEN ra.comprehension_score ELSE NULL END)::numeric, 1) as avg_comprehension,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ra.on_track = true) / NULLIF(COUNT(*), 0)::numeric, 1) as pct_on_track
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.status = 'completed'
        AND COALESCE(u.is_test_user, false) = false
        ${regionFilter}
      `,
      params
    );

    return NextResponse.json(result.rows[0] || {});
  } catch (error: any) {
    console.error('Error fetching overview:', error);
    return NextResponse.json({
      error: 'Failed to fetch overview data',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

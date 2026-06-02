import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT u.region
      FROM users u
      WHERE COALESCE(u.is_test_user, false) = false
      ORDER BY u.region
      LIMIT 100
    `);

    let regions = result.rows
      .map((r: any) => r.region)
      .filter((r: any) => r && r.trim() !== '');

    // Check if there are international users (NULL regions or non-Pakistan schools)
    const intlResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM users u
      WHERE (u.region IS NULL OR u.region = '')
        AND COALESCE(u.is_test_user, false) = false
    `);

    if (intlResult.rows[0].count > 0) {
      regions.push('International');
    }

    return NextResponse.json({
      regions: regions,
      count: regions.length
    });
  } catch (error: any) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({
      error: 'Failed to fetch regions',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

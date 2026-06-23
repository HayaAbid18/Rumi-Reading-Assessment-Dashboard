import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT
        u.id,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as name
      FROM users u
      WHERE EXISTS (
        SELECT 1 FROM reading_assessments ra
        WHERE ra.user_id = u.id AND ra.status = 'completed'
      )
      ORDER BY COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')`
    );

    return NextResponse.json({
      users: result.rows || []
    });
  } catch (error: any) {
    console.error('Error fetching users list:', error);
    return NextResponse.json({
      error: 'Failed to fetch users list',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

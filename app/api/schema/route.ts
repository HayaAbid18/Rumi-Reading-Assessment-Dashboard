import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get reading_assessments columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'reading_assessments'
      ORDER BY ordinal_position
    `);

    // Get sample data
    const sampleResult = await pool.query(`
      SELECT * FROM reading_assessments LIMIT 3
    `);

    // Get chat_sessions columns
    const sessionsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'chat_sessions'
      ORDER BY ordinal_position
    `);

    // Get users columns
    const usersResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    // Count records
    const countsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM reading_assessments) as reading_assessments,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM chat_sessions) as chat_sessions
    `);

    return NextResponse.json({
      reading_assessments: {
        columns: columnsResult.rows,
        sample: sampleResult.rows,
        count: countsResult.rows[0]?.reading_assessments || 0
      },
      chat_sessions: {
        columns: sessionsResult.rows,
        count: countsResult.rows[0]?.chat_sessions || 0
      },
      users: {
        columns: usersResult.rows,
        count: countsResult.rows[0]?.users || 0
      }
    });
  } catch (error: any) {
    console.error('Schema error:', error);
    return NextResponse.json({
      error: 'Failed to fetch schema',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

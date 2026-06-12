import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_identifier');

  try {
    if (!studentId) {
      return NextResponse.json(
        { error: 'student_identifier parameter is required' },
        { status: 400 }
      );
    }

    // Get all assessments for this student
    const assessmentsResult = await pool.query(
      `SELECT
        ra.id,
        ra.wcpm,
        ra.accuracy_percentage,
        ra.comprehension_score,
        ra.on_track,
        ra.created_at,
        ra.grade_level,
        ra.passage_type,
        ra.language,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as teacher_name,
        u.school_name,
        EXTRACT(EPOCH FROM (ra.completed_at - ra.created_at))::int as duration_seconds
      FROM reading_assessments ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.student_identifier = $1
        AND ra.status = 'completed'
      ORDER BY ra.created_at DESC`,
      [studentId]
    );

    // Calculate summary stats
    const assessments = assessmentsResult.rows;
    const summary = {
      student_identifier: studentId,
      total_assessments: assessments.length,
      avg_wcpm: assessments.length > 0
        ? Math.round(assessments.reduce((sum: number, a: any) => sum + (a.wcpm || 0), 0) / assessments.length * 10) / 10
        : 0,
      avg_accuracy: assessments.length > 0
        ? Math.round(assessments.reduce((sum: number, a: any) => sum + (a.accuracy_percentage || 0), 0) / assessments.length * 10) / 10
        : 0,
      on_track_count: assessments.filter((a: any) => a.on_track).length,
      first_assessment: assessments.length > 0 ? assessments[assessments.length - 1].created_at : null,
      last_assessment: assessments.length > 0 ? assessments[0].created_at : null,
      days_since_last: assessments.length > 0
        ? Math.floor((new Date().getTime() - new Date(assessments[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
        : null
    };

    return NextResponse.json({
      summary,
      assessments: assessments.map((a: any) => ({
        ...a,
        date: a.created_at,
        duration_minutes: a.duration_seconds ? Math.round(a.duration_seconds / 60 * 10) / 10 : 0
      }))
    });
  } catch (error: any) {
    console.error('Error fetching user history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user history',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

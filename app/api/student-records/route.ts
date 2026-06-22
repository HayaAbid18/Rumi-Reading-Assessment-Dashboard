import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get('school');
  const region = request.nextUrl.searchParams.get('region');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');
  const language = request.nextUrl.searchParams.get('language');
  const excludedUserIdsParam = request.nextUrl.searchParams.get('excludedUserIds');
  const excludedUserIds = excludedUserIdsParam ? excludedUserIdsParam.split(',') : [];

  try {
    // Build filter conditions
    const filters: string[] = ["ra.status = 'completed'"];
    const params: any[] = [];

    if (excludedUserIds.length > 0) {
      filters.push(`ra.user_id NOT IN (${excludedUserIds.map((_, i) => `$${params.length + i + 1}`).join(',')})`);
      params.push(...excludedUserIds);
    }

    if (region && region !== 'All') {
      if (region === 'International') {
        filters.push("(u.region IS NULL OR u.region = '')");
      } else {
        filters.push(`u.region = $${params.length + 1}`);
        params.push(region);
      }
    }

    if (school && school !== 'All') {
      filters.push(`u.school_name = $${params.length + 1}`);
      params.push(school);
    }

    if (language && language !== 'all') {
      filters.push(`LOWER(ra.language) = $${params.length + 1}`);
      params.push(language.toLowerCase());
    }

    if (startDate && endDate) {
      filters.push(`ra.created_at::date >= $${params.length + 1}`);
      filters.push(`ra.created_at::date <= $${params.length + 2}`);
      params.push(startDate, endDate);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const result = await pool.query(
      `SELECT
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
      ${whereClause}
      ORDER BY ra.created_at DESC
      LIMIT 500`,
      params
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching student records:', error);
    return NextResponse.json({
      error: 'Failed to fetch student records',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

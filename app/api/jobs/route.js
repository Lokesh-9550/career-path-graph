// app/api/jobs/route.js
import { NextResponse } from 'next/server';
import { getDriver } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    // 3-hop traversal: Student -> Course -> Skill <- JobRole
    const result = await session.run(`
      MATCH (s:Student {id: $studentId})-[:ENROLLED_IN]->(c:Course)-[:TEACHES]->(sk:Skill)<-[:REQUIRES]-(j:JobRole)
      WITH j, collect(DISTINCT sk.name) AS matchedSkills
      RETURN j.id AS jobId, j.title AS jobTitle, j.company AS company, matchedSkills
    `, { studentId });

    const jobs = result.records.map(record => ({
      jobId: record.get('jobId'),
      jobTitle: record.get('jobTitle'),
      company: record.get('company'),
      matchedSkills: record.get('matchedSkills')
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs. Database might be unreachable.' }, { status: 500 });
  } finally {
    await session.close();
  }
}
// app/api/gaps/route.js
import { NextResponse } from 'next/server';
import { getDriver } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const jobId = searchParams.get('jobId');

  if (!studentId || !jobId) {
    return NextResponse.json({ error: 'Student ID and Job ID are required' }, { status: 400 });
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    // Graph pattern matching for missing links
    const result = await session.run(`
      MATCH (s:Student {id: $studentId}), (j:JobRole {id: $jobId})
      MATCH (j)-[:REQUIRES]->(requiredSkill:Skill)
      WHERE NOT EXISTS { 
        MATCH (s)-[:ENROLLED_IN]->(:Course)-[:TEACHES]->(requiredSkill) 
      }
      OPTIONAL MATCH (c:Course)-[:TEACHES]->(requiredSkill)
      RETURN requiredSkill.name AS missingSkill, collect(c.title) AS recommendedCourses
    `, { studentId, jobId });

    const gaps = result.records.map(record => ({
      missingSkill: record.get('missingSkill'),
      recommendedCourses: record.get('recommendedCourses')
    }));

    return NextResponse.json({ gaps });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch skill gaps.' }, { status: 500 });
  } finally {
    await session.close();
  }
}
// app/api/students/route.js
import { NextResponse } from 'next/server';
import { getDriver } from '@/lib/db';

export async function GET() {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(`MATCH (s:Student) RETURN s.id AS id, s.name AS name ORDER BY s.name`);
    const students = result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name')
    }));
    return NextResponse.json({ students });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch students. Database might be unreachable.' }, { status: 500 });
  } finally {
    await session.close();
  }
}
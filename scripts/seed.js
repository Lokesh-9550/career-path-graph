// scripts/seed.js
require('dotenv').config({ path: '.env.local' });
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD)
);

async function seed() {
  const session = driver.session();
  
  try {
    console.log('Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('Creating Nodes...');
    // 1. Students
    await session.executeWrite(tx => tx.run(`
      UNWIND $students AS s 
      MERGE (st:Student {id: s.id}) 
      SET st.name = s.name, st.email = s.email
    `, { 
      students: [
        {id: 's1', name: 'Alice Johnson', email: 'alice@wexa.ai'}, 
        {id: 's2', name: 'Bob Smith', email: 'bob@wexa.ai'}
      ] 
    }));

    // 2. Courses
    await session.executeWrite(tx => tx.run(`
      UNWIND $courses AS c 
      MERGE (co:Course {id: c.id}) 
      SET co.title = c.title, co.code = c.code
    `, { 
      courses: [
        {id: 'c1', title: 'Intro to Python', code: 'CS101'}, 
        {id: 'c2', title: 'Data Structures', code: 'CS201'}, 
        {id: 'c3', title: 'Web Development', code: 'CS301'},
        {id: 'c4', title: 'Databases', code: 'CS401'}
      ] 
    }));

    // 3. Skills
    await session.executeWrite(tx => tx.run(`
      UNWIND $skills AS s 
      MERGE (sk:Skill {id: s.id}) 
      SET sk.name = s.name
    `, { 
      skills: [
        {id: 'sk1', name: 'Python'}, 
        {id: 'sk2', name: 'Algorithms'}, 
        {id: 'sk3', name: 'React'}, 
        {id: 'sk4', name: 'SQL'},
        {id: 'sk5', name: 'Node.js'}
      ] 
    }));

    // 4. Jobs
    await session.executeWrite(tx => tx.run(`
      UNWIND $jobs AS j 
      MERGE (jb:JobRole {id: j.id}) 
      SET jb.title = j.title, jb.company = j.company
    `, { 
      jobs: [
        {id: 'j1', title: 'Backend Engineer', company: 'Wexa AI'}, 
        {id: 'j2', title: 'Frontend Engineer', company: 'TechCorp'},
        {id: 'j3', title: 'Data Scientist', company: 'DataMinds'}
      ] 
    }));

    console.log('Creating Relationships...');
    // 5. Student -> ENROLLED_IN -> Course
    await session.executeWrite(tx => tx.run(`
      MATCH (s:Student {id: 's1'}), (c:Course) 
      WHERE c.id IN ['c1', 'c2', 'c4'] 
      MERGE (s)-[:ENROLLED_IN]->(c)
    `));
    await session.executeWrite(tx => tx.run(`
      MATCH (s:Student {id: 's2'}), (c:Course) 
      WHERE c.id IN ['c1', 'c3'] 
      MERGE (s)-[:ENROLLED_IN]->(c)
    `));

    // 6. Course -> TEACHES -> Skill
    await session.executeWrite(tx => tx.run(`
      MATCH (c:Course {id: 'c1'}), (s:Skill {id: 'sk1'}) MERGE (c)-[:TEACHES]->(s)
    `));
    await session.executeWrite(tx => tx.run(`
      MATCH (c:Course {id: 'c2'}), (s:Skill {id: 'sk2'}) MERGE (c)-[:TEACHES]->(s)
    `));
    await session.executeWrite(tx => tx.run(`
      MATCH (c:Course {id: 'c3'}), (s:Skill {id: 'sk3'}) MERGE (c)-[:TEACHES]->(s)
    `));
    await session.executeWrite(tx => tx.run(`
      MATCH (c:Course {id: 'c4'}), (s:Skill {id: 'sk4'}) MERGE (c)-[:TEACHES]->(s)
    `));

    // 7. Job -> REQUIRES -> Skill
    await session.executeWrite(tx => tx.run(`
      MATCH (j:JobRole {id: 'j1'}), (s:Skill) 
      WHERE s.id IN ['sk1', 'sk2', 'sk4'] 
      MERGE (j)-[:REQUIRES]->(s)
    `));
    await session.executeWrite(tx => tx.run(`
      MATCH (j:JobRole {id: 'j2'}), (s:Skill) 
      WHERE s.id IN ['sk3', 'sk5'] 
      MERGE (j)-[:REQUIRES]->(s)
    `));
    await session.executeWrite(tx => tx.run(`
      MATCH (j:JobRole {id: 'j3'}), (s:Skill) 
      WHERE s.id IN ['sk1', 'sk2'] 
      MERGE (j)-[:REQUIRES]->(s)
    `));

    console.log('✅ Seed data loaded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
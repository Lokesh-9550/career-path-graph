Career Path Planner (Graph Database Application)

A web application that helps students discover career paths based on their enrolled courses. It uses CognoDB (a managed graph database) to map the relationships between Students, Courses, Skills, and Job Roles, allowing for complex multi-hop queries to recommend jobs and identify skill gaps.

Why a graph database?
In a relational database, finding the optimal career path for a student requires complex, computationally expensive JOIN operations. To find which jobs a student qualifies for, you must join Students to Enrollments, Enrollments to Courses, Courses to CourseSkills, and JobSkills to Jobs. Furthermore, finding missing skills and recommendations for courses to bridge those gaps requires recursive or nested subqueries that are notoriously awkward in SQL.

A graph database thrives here. By modeling students, courses, skills, and jobs as interconnected nodes, we can traverse the path directly using Cypher. Finding qualified jobs or skill gaps becomes a simple 2-3 hop pattern match, executing in milliseconds regardless of dataset growth.

Data Model
Data Model Diagram

Nodes:

Student (id, name, email)
Course (id, title, code)
Skill (id, name)
JobRole (id, title, company)
Relationships:

(:Student)-[:ENROLLED_IN]->(:Course)
(:Course)-[:TEACHES]->(:Skill)
(:JobRole)-[:REQUIRES]->(:Skill)
Main Queries Explained
1. Multi-hop Traversal (Find Qualified Jobs)Finds all Job Roles a Student is qualified for based on the courses they took (3-hop traversal).

MATCH (s:Student {id: $studentId})-[:ENROLLED_IN]->(c:Course)-[:TEACHES]->(sk:Skill)<-[:REQUIRES]-(j:JobRole)WITH j, collect(DISTINCT sk.name) AS matchedSkillsRETURN j.id AS jobId, j.title AS jobTitle, j.company AS company, matchedSkills
2. Awkward for SQL (Find Skill Gaps & Recommend Courses)
Finds the skills a student is MISSING for a specific job, and recommends courses to learn them. SQL struggles heavily with "find what is NOT connected" across multiple join tables.

MATCH (s:Student {id: $studentId}), (j:JobRole {id: $jobId})
MATCH (j)-[:REQUIRES]->(requiredSkill:Skill)
WHERE NOT EXISTS { 
  MATCH (s)-[:ENROLLED_IN]->(:Course)-[:TEACHES]->(requiredSkill) 
}
OPTIONAL MATCH (c:Course)-[:TEACHES]->(requiredSkill)
RETURN requiredSkill.name AS missingSkill, collect(c.title) AS recommendedCourses

Setup and Run Instructions

1. Prerequisites
Node.js installed
A CognoDB Cloud instance (Free tier)

2. Environment Variables
Create a .env.local file in the root directory with your CognoDB credentials:

COGNODB_URI=bolt+s://<your-instance-id>.databases.cognodb.com
COGNODB_USER=cognodb
COGNODB_PASSWORD=<your-password>

3. Install Dependencies
npm install

4. Seed the Database
node scripts/seed.js

5. Run the Application
npm run dev

Visit http://localhost:3000 to use the app.

Demo Links

Hosted App: [https://career-path-graph.vercel.app]
Screen Recording: [https://www.loom.com/share/311c171de50d4ab8a0e0cc8b9cc581c6]

// app/page.js
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState(null);

  // Fetch students on mount
  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/students");
        if (!res.ok) throw new Error("Failed to load students");
        const data = await res.json();
        setStudents(data.students);
        if (data.students.length > 0) {
          setSelectedStudent(data.students[0].id); // Auto-select first
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchStudents();
  }, []);

  // Fetch jobs when student changes
  useEffect(() => {
    if (!selectedStudent) return;
    
    async function fetchJobs() {
      setLoadingJobs(true);
      setJobs([]); // Clear old jobs
      try {
        const res = await fetch(`/api/jobs?studentId=${selectedStudent}`);
        if (!res.ok) throw new Error("Failed to load jobs");
        const data = await res.json();
        setJobs(data.jobs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingJobs(false);
      }
    }
    fetchJobs();
  }, [selectedStudent]);

  if (loadingStudents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg shadow">{error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Career Path Planner</h1>
        <p className="text-gray-600 mb-8">Find jobs you qualify for and discover missing skills.</p>

        {/* Student Selector */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
          <select 
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Jobs Section */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Qualified Job Roles</h2>
        
        {loadingJobs ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
            No jobs matched yet. Try enrolling in more courses!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard 
                key={job.jobId} 
                job={job} 
                studentId={selectedStudent} 
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function JobCard({ job, studentId }) {
  const [gaps, setGaps] = useState(null);
  const [showGaps, setShowGaps] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(false);

  async function fetchGaps() {
    if (showGaps) {
      setShowGaps(false); // Toggle close
      return;
    }
    
    setLoadingGaps(true);
    setShowGaps(true);
    try {
      const res = await fetch(`/api/gaps?studentId=${studentId}&jobId=${job.jobId}`);
      if (!res.ok) throw new Error("Failed to load gaps");
      const data = await res.json();
      setGaps(data.gaps);
    } catch (err) {
      setGaps([{ missingSkill: "Error loading gaps", recommendedCourses: [] }]);
    } finally {
      setLoadingGaps(false);
    }
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900">{job.jobTitle}</h3>
      <p className="text-sm text-gray-500 mb-3">{job.company}</p>
      
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Matched Skills</p>
        <div className="flex flex-wrap gap-2">
          {job.matchedSkills.map((skill) => (
            <span key={skill} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <button 
        onClick={fetchGaps}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {showGaps ? "Hide" : "View"} Skill Gaps
      </button>

      {showGaps && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {loadingGaps ? (
            <div className="animate-pulse text-sm text-gray-400">Calculating gaps...</div>
          ) : gaps && gaps.length > 0 ? (
            <div className="space-y-2">
              {gaps.map((gap) => (
                <div key={gap.missingSkill} className="text-sm">
                  <span className="font-medium text-red-600">Missing: {gap.missingSkill}</span>
                  {gap.recommendedCourses.length > 0 && (
                    <span className="text-gray-500"> → Take: {gap.recommendedCourses.join(", ")}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-600">✨ You meet all the requirements for this role!</p>
          )}
        </div>
      )}
    </div>
  );
}
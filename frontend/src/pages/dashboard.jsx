import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";

// Reusable component: Skill status icon
const SkillStatusIcon = ({ hasSkill }) =>
  hasSkill
    ? <span className="text-emerald-500 font-bold">✓</span>
    : <span className="text-red-400 font-bold">✗</span>;

// Utility: Get top occurring skills across all profiles
const getTopSkills = (profiles, limit = 8) => {
  const freq = {};
  profiles.forEach(profile => {
    (profile.skills || []).forEach(skill => {
      freq[skill] = (freq[skill] || 0) + 1;
    });
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skill]) => skill);
};

// Utility: Prepare radar chart data comparing ideal vs candidate
const buildRadarData = (profiles, skills, selectedId) => {
  const selectedProfile = profiles.find(p => p.document_id === selectedId);
  if (!selectedProfile) return { data: [], candidateName: 'Candidate', skillMatch: [] };

  const candidateName = selectedProfile.name?.split(' ')[0] || selectedProfile.document_id;
  const skillMatch = [];

  const data = skills.map(skill => {
    const hasSkill = (selectedProfile.skills || []).map(s => s.toLowerCase()).includes(skill.toLowerCase());
    skillMatch.push({ skill, hasSkill });
    return {
      skill,
      Ideal: 1,
      [candidateName]: hasSkill ? 1 : 0,
    };
  });

  return { data, candidateName, skillMatch };
};

// Main Dashboard component
const Dashboard = ({ results = [], userSkills = [], topK = 10 }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!results.length) {
        setProfiles([]);
        return;
      }

      setLoading(true);
      const topResults = results.slice(0, topK);

      const fetched = await Promise.all(
        topResults.map(async ({ document_id, score }) => {
          try {
            const { data } = await axios.get(`http://localhost:8000/profile/${document_id}`);
            return { ...data, score: Math.round(score) };
          } catch (err) {
            console.error("❌ Failed to fetch", document_id, err);
            return null;
          }
        })
      );

      const validProfiles = fetched.filter(Boolean);
      setProfiles(validProfiles);

      if (validProfiles.length > 0) {
        setSelectedProfileId(validProfiles[0].document_id);
      }

      setLoading(false);
    };

    fetchProfiles();
  }, [results, topK]);

  // === Chart Data Prep ===
  const sortedProfiles = [...profiles].sort((a, b) => b.score - a.score);
  const barData = sortedProfiles.map(p => ({
    name: p.name?.split(" ")[0] || p.document_id,
    score: p.score,
  }));

  const colors = {
    ideal: "#14B8A6",
    candidate: "#000148ff",
  };

  const radarChartSkills = userSkills.length > 0 ? userSkills : getTopSkills(profiles, 8);
  const { data: radarData, candidateName, skillMatch } = buildRadarData(profiles, radarChartSkills, selectedProfileId);

  return (
    <div className="p-8 space-y-12 min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <h2 className="text-3xl font-bold text-emerald-700 mb-4">
        Top {profiles.length} Candidates Overview
      </h2>

      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
      ) : profiles.length === 0 ? (
        <p className="text-gray-500">No data available to display.</p>
      ) : (
        <>

          {/* --- Reworked Skill Comparison Section --- */}
          {radarChartSkills.length > 0 && (
            <div className="w-full bg-white shadow rounded-xl p-8 space-y-6">
              {/* Header */}
              <h3 className="text-2xl font-bold text-emerald-700">
                Skill Analysis vs. Ideal Profile
              </h3>

              {/*  Candidate Select Dropdown */}
              <div>
                <label htmlFor="profile-select" className="mr-3 text-sm font-medium text-gray-700">
                  Compare Candidate:
                </label>
                <select
                  id="profile-select"
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  {sortedProfiles.map(p => (
                    <option key={p.document_id} value={p.document_id}>
                      {p.name} (Score: {p.score})
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔳 Main Section: Top-aligned columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                {/* ◀️ Left Column: Description + Skill Table */}
                <div className="flex flex-col gap-8">
                  {/* 🧭 Explanation */}
                  <div className="text-md text-gray-600">
                    <h4 className="font-semibold text-gray-800 text-base mb-2">About this Chart</h4>
                    <p>
                      This chart compares the selected candidate against a synthetic 'Ideal' profile.
                      The axes represent the key skills relevant to the job description.
                    </p>
                    <p className="mt-2">
                      The <span style={{ color: colors.ideal, fontWeight: 600 }}>green area</span> represents the 'Ideal' candidate, while the <span style={{ color: colors.candidate, fontWeight: 600 }}>purple area</span> represents the selected candidate.
                    </p>
                  </div>

                  {/* 🧩 Skill Match Table */}
                  <div className="w-full">
                    <table className="min-w-full border-collapse border border-slate-200 rounded-lg shadow-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          {skillMatch.map(({ skill }) => (
                            <th key={skill} className="px-3 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-center border-b border-slate-200">
                              {skill}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          {skillMatch.map(({ skill, hasSkill }) => (
                            <td key={skill} className="px-3 py-4 text-center text-xl">
                              <SkillStatusIcon hasSkill={hasSkill} />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-md text-gray-500 mt-3 italic">
                      The table offers a quick glance at the candidate's skill set. A green checkmark (✓) signifies a match, while a red cross (✗) indicates the skill is not listed on the candidate's profile.
                    </p>
                    <div className="mt-6 flex justify-center gap-8 text-base font-semibold">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded full bg-emerald-500 inline-block"></span>
                        <span className="text-gray-700">Ideal</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded full bg-indigo-500 inline-block"></span>
                        <span className="text-gray-700">{candidateName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ▶️ Right Column: Radar Chart */}
                <div className="w-full h-full flex items-center justify-center min-h-[24rem]">
                  <ResponsiveContainer width="100%" height="110%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="90%"
                      data={radarData}
                      margin={{ top: 10, right: 30, bottom: 30, left: 30 }}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                      <Radar
                        name="Ideal"
                        dataKey="Ideal"
                        stroke={colors.ideal}
                        fill={colors.ideal}
                        fillOpacity={0.2}
                      />
                      <Radar
                        name={candidateName}
                        dataKey={candidateName}
                        stroke={colors.candidate}
                        fill={colors.candidate}
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>
          )}

          {/* 📋 Table Overview */}
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Skills (count)</th>
                  <th className="px-6 py-3 font-medium">Experience (yrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedProfiles.map(p => (
                  <tr key={p.document_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="px-6 py-3">{p.score}</td>
                    <td className="px-6 py-3">{p.skills?.length ?? 0}</td>
                    <td className="px-6 py-3">{p.years_experience ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
        </>
      )}
    </div>
  );
};

export default Dashboard;
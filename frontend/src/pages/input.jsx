// pages/input.jsx

import React, { useState, useCallback, memo } from 'react';
import {
  FileText, Eye
} from 'lucide-react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import axios from 'axios';

// === Memoized Skill Tag ===
const SkillTag = memo(({ skill }) => (
  <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-xs font-medium cursor-pointer hover:from-blue-200 hover:to-purple-200 transition-transform duration-300 transform hover:scale-110">
    {skill}
  </span>
));

export default function InputPage({ activeTab, onTabChange, jobDescription, setJobDescription, setSearchResults }) {
  const [errorMessage, setErrorMessage] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [userSkills, setUserSkills] = useState([]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !userSkills.includes(trimmed)) {
      setUserSkills([...userSkills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setUserSkills(userSkills.filter(skill => skill !== skillToRemove));
  };

  const [topk, setTopK] = useState(10);


  const handleDescriptionChange = useCallback((e) => {
    setJobDescription(e.target.value);
  }, [setJobDescription]);

  const handleSmartSearch = async (e) => {
    e.preventDefault();

    if (!jobDescription.trim()) {
      setErrorMessage("Please enter a job description to get profiles.");
      setTimeout(() => {
        setErrorMessage('');
      }, 1500); // Hide after 1 seconds
      return; // ❌ Do not navigate
    }

    // Show loading state
    setSearchResults({
      results: [],
      loadingInfo: {
        isLoading: true,
        topK: topk,
        total: topk,
        error: null
      },
      userSkills: userSkills
    });
    onTabChange("Search Results");

    try {
      const response = await axios.post("http://localhost:8000/search", {
        job_description: jobDescription,
        top_k: topk
      });

      setSearchResults({
        results: response.data,
        loadingInfo: {
          isLoading: false,
          topK: topk,
          total: response.data.length,
          error: null
        },
        userSkills: userSkills
      });
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults({
        results: [],
        loadingInfo: {
          isLoading: false,
          topK: 0,
          total: 0,
          error: "Search failed. Please try again later."
        },
        userSkills: userSkills
      });
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <m.div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col relative">
        <svg className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,0 100,0 0,100" fill="#3B82F6" opacity="0.08" />       {/* Blue-500 */}
          <polygon points="100,100 200,0 200,200" fill="#6366F1" opacity="0.08" />  {/* Indigo-500 */}
          <polygon points="100,300 300,100 400,400" fill="#A78BFA" opacity="0.08" />{/* Purple-400 */}
          <polygon points="1400,650 1300,750 1200,600" fill="#6366F1" opacity="0.04" />
          <polygon points="1100,700 1200,800 1300,700" fill="#A78BFA" opacity="0.05" />
          <polygon points="1000,900 1100,950 1050,1050" fill="#3B82F6" opacity="0.05" />
          <polygon points="1150,850 1250,900 1200,1000" fill="#6366F1" opacity="0.05" />
        </svg>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start px-6 pt-12 pb-0">
          {errorMessage && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 px-4 py-3 rounded-lg bg-blue-100 text-white-800 shadow font-medium text-sm"
            >
              ⚠️ {errorMessage}
            </m.div>
          )}

          {/* Instruction Text */}
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Enter a job description to fetch suitable candidates.
            </h2>
          </div>

          {/* Job Description Card */}
          <div className="w-full max-w-4xl bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="mb-6">
              <label className="flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Job Description</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </label>
              <div className="relative">
                <textarea
                  value={jobDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Describe your ideal candidate..."
                  rows={6}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-base placeholder-gray-400 bg-white/50 backdrop-blur-sm"
                />
                <div className="absolute bottom-4 right-4 flex space-x-2 text-xs text-gray-400 items-center">
                  <Eye className="w-4 h-4" />
                  <span>{jobDescription.length}/2000</span>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Type skill and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {userSkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-blue-600 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of candidates (Top K)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={topk}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm"
                placeholder="e.g., 10"
              />
            </div>


            {/* Search Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSmartSearch}
                className="group flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transform hover:scale-105"
              >
                <span>Fetch Profiles</span>
              </button>
            </div>
          </div>
        </div>

      </m.div>
    </LazyMotion>
  );
}

import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';

const SearchResults = ({ results = [], loadingInfo = {}, userSkills = [] }) => {
  // State for filters and modal
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [minExperience, setMinExperience] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for data and pagination
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 9;

  // State for loading status
  const { isLoading, error = null, topK = 10 } = loadingInfo || {};
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const fetchedIdsRef = useRef('');

  // ⭐️ New state for sorting
  const [sortBy, setSortBy] = useState('relevance');

  // Combined loading status
  const isFetching = isLoading || isFetchingDetails;

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
    setCurrentPage(1);
  };

  // Effect to fetch profile details
  useEffect(() => {
    const fetchProfiles = async () => {
      const currentIds = results.map(r => r.document_id).join(',');
      if (!results.length || fetchedIdsRef.current === currentIds) {
        return;
      }
      fetchedIdsRef.current = currentIds;
      setProfiles([]);
      setSortBy('relevance'); // Reset sort on new search
      setIsFetchingDetails(true);
      try {
        const fetched = await Promise.all(
          results.map(async (res) => {
            try {
              const { data } = await axios.get(`http://localhost:8000/profile/${res.document_id}`);
              return { ...data, score: Math.round(res.score) };
            } catch (err) {
              console.error("❌ Failed to fetch profile:", res.document_id);
              return null;
            }
          })
        );
        setProfiles(fetched.filter(Boolean));
      } catch (error) {
        console.error("❌ An error occurred during profile fetching:", error);
      } finally {
        setIsFetchingDetails(false);
      }
    };
    fetchProfiles();
  }, [results]);

  // Effect to apply filters
  useEffect(() => {
    const filtered = profiles.filter(p => {
      const meetsExp = (p.years_experience || 0) >= minExperience;
      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every(skill =>
          (p.skills || []).map(s => s.toLowerCase()).includes(skill.toLowerCase())
        );
      return meetsExp && matchesSkills;
    });
    setFilteredProfiles(filtered);
    setCurrentPage(1);
  }, [profiles, minExperience, selectedSkills]);

  // ⭐️ Memoized sorting logic
  const sortedProfiles = useMemo(() => {
    const profilesToSort = [...filteredProfiles];
    if (sortBy === 'experience') {
      profilesToSort.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
    }
    // No action needed for 'relevance' as it's the default order
    return profilesToSort;
  }, [filteredProfiles, sortBy]);


  const openModal = (profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProfile(null);
    setIsModalOpen(false);
  };

  // Pagination now based on sorted profiles
  const paginatedProfiles = sortedProfiles.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);
  const totalPages = Math.ceil(sortedProfiles.length / resultsPerPage);

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-blue-700">Matched Profiles</h2>
        {/* ⭐️ Container for Sort and Filter controls */}
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg text-sm shadow hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="experience">Experience</option>
            </select>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className="px-4 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg text-sm shadow hover:bg-blue-50"
            >
              Filters
            </button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Experience (years)</label>
                  <input
                    type="number"
                    min={0}
                    value={minExperience}
                    onChange={(e) => {
                      setMinExperience(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                {userSkills.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {userSkills.map((skill, idx) => (
                        <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            value={skill}
                            checked={selectedSkills.includes(skill)}
                            onChange={() => toggleSkill(skill)}
                            className="accent-blue-600"
                          />
                          {skill}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="text-center text-red-600 font-semibold text-lg py-10">⚠️ {error}</div>}

      {/* Simplified Loading State */}
      {!error && isFetching ? (
        <div className="text-center text-gray-600 animate-pulse">
          <p className="text-lg font-medium mb-2">
            {`Fetching top ${topK} candidates...`}
          </p>
          <div className="mt-4">
            <span className="inline-block w-6 h-6 border-4 border-purple-500 border-dashed rounded-full animate-spin"></span>
          </div>
        </div>
      ) : !isFetching && sortedProfiles.length === 0 ? (
        <p className="text-center text-gray-500 py-10">{profiles.length > 0 ? "No profiles match the current filters." : "No profiles found."}</p>
      ) : (
        <>
          {/* Profiles Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProfiles.map((profile, index) => {
              // ⭐️ Calculate rank based on overall sorted position
              const rank = (currentPage - 1) * resultsPerPage + index + 1;
              return (
                <div
                  key={profile.document_id}
                  className="relative bg-white/90 border border-blue-100 p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300 cursor-pointer hover:scale-[1.02]"
                  onClick={() => openModal(profile)}
                >
                  {/* ⭐️ Display the rank */}
                  <span className="absolute top-4 right-4 text-xl font-bold text-blue-500">#{rank}</span>
                  <h3 className="text-xl font-semibold text-blue-700 mb-1">{profile.name}</h3>
                  <p className="text-gray-600 text-sm mb-1">Email: {profile.email}</p>
                  <p className="text-gray-600 text-sm mb-1">Score: <span className="font-medium text-purple-600">{profile.score}</span></p>
                  {/* ⭐️ Display experience on the card */}
                  <p className="text-gray-600 text-sm mb-3">Experience: <span className="font-medium">{profile.years_experience || 0} years</span></p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills?.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">{skill}</span>
                    ))}
                    {profile.skills?.length > 4 && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium">+{profile.skills.length - 4} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10 space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {[...Array(totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => setCurrentPage(page + 1)}
                  className={`px-3 py-2 rounded ${currentPage === page + 1 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {page + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal View */}
      {isModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={closeModal}>&times;</button>
            <h2 className="text-2xl font-bold text-blue-700 mb-1">{selectedProfile.name}</h2>
            <p className="text-gray-500 mb-4">{selectedProfile.email}</p>
            <p className="mb-1"><strong>Mobile:</strong> {selectedProfile.mobile_number || "N/A"}</p>
            <p className="mb-1"><strong>Experience:</strong> {selectedProfile.years_experience} years</p>
            <p className="mb-3"><strong>Location:</strong> {selectedProfile.location || "N/A"}</p>
            <div className="mb-4">
              <strong>Skills:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProfile.skills?.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <strong>Previous Roles:</strong>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                {selectedProfile.prev_roles?.map((role, idx) => <li key={idx}>{role}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
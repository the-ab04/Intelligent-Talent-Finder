import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  FileText, Search, BarChart3, Briefcase, User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import InputPage from "./input";
import SearchResults from "./SearchResults";
import Dashboard from "./dashboard";
import Upload from "./Upload";

const TabButton = ({ tab, isActive, onClick }) => {
  const getTabStyles = useCallback((color) => ({
    blue: 'border-blue-500 text-blue-600 bg-blue-50/50',
    purple: 'border-purple-500 text-purple-600 bg-purple-50/50',
    emerald: 'border-emerald-500 text-emerald-600 bg-emerald-50/50',
  }[color]), []);

  const getIconStyles = useCallback((color) => ({
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
  }[color]), []);

  const getPulseStyles = useCallback((color) => ({
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
  }[color]), []);

  return (
    <button
      onClick={() => onClick(tab.name)}
      className={`py-4 px-4 border-b-[3px] font-semibold text-sm flex items-center space-x-3 transition-all duration-300 transform hover:scale-105 ${isActive
        ? getTabStyles(tab.color)
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
      <tab.icon className={`w-5 h-5 ${isActive ? getIconStyles(tab.color) : ''}`} />
      <span>{tab.name}</span>
      {isActive && <div className={`w-2 h-2 ${getPulseStyles(tab.color)} rounded-full animate-pulse`} />}
    </button>
  );
};

const TabLayout = () => {
  const [activeTab, setActiveTab] = useState("Job Description");
  const [jobDescription, setJobDescription] = useState("");
  const [searchResults, setSearchResults] = useState({
    results: [],
    loadingInfo: { isLoading: false, total: 0, topK: 0 }
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const tabs = useMemo(() => [
    { name: 'Upload', icon: FileText, color: 'blue' },
    { name: 'Job Description', icon: FileText, color: 'blue' },
    { name: 'Search Results', icon: Search, color: 'purple' },
    { name: 'Dashboard', icon: BarChart3, color: 'emerald' }
  ], []);

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await fetch("http://localhost:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data); 
      } else {
        console.error("Auth failed:", await res.text());
      }
    };

    fetchUser();
  }, []);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">

      {/* ✅ Header */}
      <div className="bg-white/60 backdrop-blur-md border-b border-white/20 px-6 py-4 flex items-center justify-between shadow-md relative z-[20]">

        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Talent Finder
            </h1>
            <p className="text-xs text-gray-500">AI-Powered Recruitment</p>
          </div>
        </div>

        {/* ✅ User Dropdown */}
        <div className="relative z-[9999]" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md cursor-pointer"
          >
            <User className="w-5 h-5 text-white" />
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-xl shadow-xl z-[9999] transition-all duration-200 ease-out transform origin-top-right animate-dropdown">
              <div className="px-4 py-3 text-sm text-gray-800 border-b border-gray-200">
                Hello, <span className="font-semibold">{user?.name || "User"}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  setDropdownOpen(false);
                  navigate("/");
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ✅ Tab Bar */}
      <div className="bg-white/60 border-b border-white/20 px-6 relative z-[10]">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <TabButton
              key={tab.name}
              tab={tab}
              isActive={activeTab === tab.name}
              onClick={setActiveTab}
            />
          ))}
        </div>
      </div>

      {/* ✅ Page Content */}
      <div className="flex-1 w-full">
        {activeTab === "Upload" && (
          <Upload onTabChange={setActiveTab} />
        )}

        {activeTab === "Job Description" && (
          <InputPage
            activeTab={activeTab}
            onTabChange={setActiveTab}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            setSearchResults={setSearchResults}
          />
        )}
        {activeTab === "Search Results" && (
          <SearchResults
            results={searchResults.results}
            loadingInfo={searchResults.loadingInfo}
            userSkills={searchResults.userSkills}
          />
        )}

        {activeTab === "Dashboard" && (
          <Dashboard
            results={searchResults.results}
            userSkills={searchResults.userSkills} />
        )}

      </div>
    </div>
  );
};

export default TabLayout;

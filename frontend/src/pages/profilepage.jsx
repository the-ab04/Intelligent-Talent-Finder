import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";

const ProfilePage = () => {
  const { id } = useParams(); // ← get document_id from URL
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/profile/${id}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [id]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 text-gray-800">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Search</span>
      </button>

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">{profile.name}</h1>
        <p className="text-gray-500 mb-4">{profile.email}</p>
        <p className="mb-2">
          <strong>Mobile:</strong> {profile.mobile_number || "N/A"}
        </p>
        <p className="mb-2">
          <strong>Experience:</strong> {profile.years_experience} years
        </p>
        <p className="mb-2">
          <strong>Location:</strong> {profile.location || "N/A"}
        </p>

        <div className="mt-4">
          <strong>Skills:</strong>
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.skills?.length > 0 ? (
              profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No skills listed</span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <strong>Previous Roles:</strong>
          <ul className="list-disc list-inside mt-2">
            {profile.prev_roles?.length > 0 ? (
              profile.prev_roles.map((role, idx) => (
                <li key={idx}>{role}</li>
              ))
            ) : (
              <li className="text-gray-500">No roles listed</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

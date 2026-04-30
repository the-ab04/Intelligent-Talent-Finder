import { useEffect, useState } from "react";
import axios from "axios";
import { FileText, Upload as UploadIcon, ArrowRight, Server, DatabaseZap, Loader2, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

export default function Upload({ onTabChange }) {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("");
    const [statusType, setStatusType] = useState("info"); // 'info', 'uploading', 'processing', 'success', 'error', 'warning'
    const [processed, setProcessed] = useState(0);
    const [total, setTotal] = useState(0);
    const [done, setDone] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [resumeCount, setResumeCount] = useState("--");
    const [dbStatus, setDbStatus] = useState("Checking...");
    const [qdrantStatus, setQdrantStatus] = useState("Checking...");

    // Fetch initial admin stats on component mount
    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const res = await axios.get("http://localhost:8000/admin/status");
                setResumeCount(res.data.resume_count);
                setDbStatus(res.data.db_status);
                setQdrantStatus(res.data.qdrant_status);
            } catch (err) {
                console.error("Failed to fetch admin stats:", err);
                setDbStatus("Offline");
                setQdrantStatus("Offline");
            }
        };
        fetchAdminStats();
    }, []);

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.name.endsWith(".zip")) {
            setFile(droppedFile);
            setStatus(`Selected: ${droppedFile.name}`);
            setStatusType("info");
        } else {
            setStatus("Only .zip files are accepted.");
            setStatusType("error");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setStatus("Please select a ZIP file first.");
            setStatusType("error");
            return;
        }

        // Reset state for a new upload
        setProcessed(0);
        setTotal(0);
        setDone(false);
        setStatus("Uploading...");
        setStatusType("uploading");

        const formData = new FormData();
        formData.append("zipfile", file);

        try {
            // 1. UPLOAD FILE & START JOB
            const res = await axios.post(`http://localhost:8000/upload-resumes`, formData);
            const jobId = res.data.job_id;
            setTotal(res.data.total_files || 0);
            setStatus("Processing... This may take a moment.");
            setStatusType("processing");

            // 2. POLL FOR REAL-TIME STATUS
            const interval = setInterval(async () => {
                try {
                    const progressRes = await axios.get(`http://localhost:8000/upload-status/${jobId}`);
                    const { processed_files, total_files, status: jobStatus } = progressRes.data;

                    setProcessed(processed_files);
                    setTotal(total_files);

                    // 3. CHECK JOB COMPLETION STATUS FROM BACKEND
                    // The backend sets the final status to 'completed', 'completed_with_errors', or 'failed'
                    if (jobStatus !== 'processing') {
                        clearInterval(interval);
                        setDone(true);

                        if (jobStatus === 'completed') {
                            setStatus("✅ Processing complete! All new resumes were added.");
                            setStatusType("success");
                        } else if (jobStatus === 'completed_with_errors') {
                            setStatus("⚠️ Finished. Some resumes were skipped (duplicates or errors).");
                            setStatusType("warning");
                        } else if (jobStatus === 'failed') {
                            setStatus("❌ A critical error occurred during processing.");
                            setStatusType("error");
                        }
                    }
                } catch (err) {
                    clearInterval(interval);
                    setStatus("❌ Could not get processing status. Check server logs.");
                    setStatusType("error");
                    console.error("Polling failed:", err);
                }
            }, 2000); // Poll every 2 seconds
        } catch (err) {
            setStatus("❌ Upload failed. The server may be down or the file is invalid.");
            setStatusType("error");
            console.error(err);
        }
    };

    const handleManualClear = async () => {
        if (!window.confirm("Are you sure you want to delete all uploaded resumes?")) return;
        try {
            await axios.delete("http://localhost:8000/clear-resumes");
            alert("All resumes cleared successfully!");
            setStatus("Cleared all resumes.");
            setStatusType("info");
            setProcessed(0);
            setTotal(0);
            setFile(null);
            setDone(false);
            const res = await axios.get("http://localhost:8000/admin/status");
            setResumeCount(res.data.resume_count);
        } catch (err) {
            console.error("Failed to clear resumes", err);
            alert("Failed to clear resumes.");
        }
    };

    // Renders the status box with appropriate icon and color
    const renderStatusBox = () => {
        const iconMap = {
            uploading: <Loader2 className="w-5 h-5 animate-spin" />,
            processing: <Loader2 className="w-5 h-5 animate-spin" />,
            success: <CheckCircle2 className="w-5 h-5" />,
            error: <AlertTriangle className="w-5 h-5" />,
            warning: <AlertCircle className="w-5 h-5" />,
            info: null,
        };
        const colorMap = {
            uploading: "text-blue-700 bg-blue-100",
            processing: "text-indigo-700 bg-indigo-100",
            success: "text-green-700 bg-green-100",
            error: "text-red-700 bg-red-100",
            warning: "text-yellow-700 bg-yellow-100",
            info: "text-gray-700 bg-gray-100",
        };

        if (!status) return null;

        return (
            <div className={`mt-4 p-4 border rounded-lg shadow-sm flex items-center gap-3 ${colorMap[statusType]}`}>
                {iconMap[statusType]}
                <span className="flex-grow font-medium">{status}</span>
            </div>
        );
    };

    // Note: The main JSX structure for the panels below is unchanged as requested.
    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6">
            {/* Admin Section */}
            <div className="lg:w-1/5 w-full space-y-6 bg-white p-6 shadow rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">🔧 Overview</h3>
                <div className="space-y-2 text-gray-700">
                    <div className="flex items-center gap-3">
                        <Server className="w-4 h-4 text-blue-500" />
                        Qdrant: <span className="font-medium">{qdrantStatus}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <DatabaseZap className="w-4 h-4 text-green-500" />
                        PostgreSQL: <span className="font-medium">{dbStatus}</span>
                    </div>
                    <div>
                        Total Resumes: <span className="font-semibold text-blue-600">{resumeCount}</span>
                    </div>
                    <button
                        onClick={handleManualClear}
                        className="text-sm mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md w-full"
                    >
                        🗑️ Clear All Resumes
                    </button>
                    <a
                        href="https://talentfinderdocs.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-sm mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md w-full"
                    >
                        📘 View Docs
                    </a>
                </div>
            </div>

            {/* Upload Panel */}
            <div className="lg:w-2/3 w-full">
                <div className="p-8 max-w-2xl mx-auto space-y-6">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <UploadIcon className="w-7 h-7 text-blue-600" />
                        Upload Resume Zip
                    </h2>
                    <p className="text-gray-600 text-m">
                        Upload a ZIP file containing resumes. The system will process them, extract text, and skip any duplicates.
                        Data will auto-delete in 24 hours. You can manually delete from the Overview.
                    </p>
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors duration-300 ${dragActive ? "border-blue-600 bg-blue-100/60" : "border-blue-400 bg-blue-50/50"}`}
                    >
                        <FileText className="w-10 h-10 text-blue-500 mb-2" />
                        <p className="text-gray-700 font-medium mb-2">
                            Drag & drop or click to upload a ZIP file
                        </p>
                        <input
                            type="file"
                            id="file-upload"
                            accept=".zip"
                            onChange={(e) => {
                                const selected = e.target.files[0];
                                if (selected) {
                                    setFile(selected);
                                    setStatus(`Selected: ${selected.name}`);
                                    setStatusType("info");
                                }
                            }}
                            className="hidden"
                        />
                        <label htmlFor="file-upload" className="mt-2 cursor-pointer text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 py-2 px-4 rounded-full">
                            Browse File
                        </label>
                        {file && <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>}
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleUpload}
                            disabled={statusType === 'uploading' || statusType === 'processing'}
                            className="px-6 py-2 rounded-lg font-medium transition duration-200 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {statusType === 'uploading' || statusType === 'processing' ? 'Working...' : 'Upload & Process'}
                        </button>
                    </div>
                    {(statusType === 'processing' || statusType === 'success' || statusType === 'warning' || statusType === 'error') && (
                        <div className="mt-4">
                            {renderStatusBox()}
                            {total > 0 && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${total > 0 ? (processed / total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 text-right">
                                        {`Processed ${processed} of ${total} files`}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    {done && (
                        <div className="mt-6">
                            <button
                                onClick={() => onTabChange("Job Description")}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
                            >
                                Continue to Job Description <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
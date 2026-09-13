import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../ui/GlassCard";
import Button from "../ui/Button";

const BASE = import.meta.env.VITE_API_URL || "/api";

export default function ResumeUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setError(null);
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setError(null);
      }
    }
  };

  const validateFile = (file) => {
    const allowedTypes = ['application/pdf'];
    const allowedExtensions = ['.pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setError('Please upload a text-based PDF file. DOC and DOCX parsing are not available yet.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit.');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));

      const token = localStorage.getItem("hr_token");
      const xhr = new XMLHttpRequest();

      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", async () => {
          setUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText || '{}');
            if (!response?.data?.resume) {
              reject(new Error('Upload completed without a resume record. Please try again.'));
              return;
            }
            onUploadComplete?.(response.data.resume);
            resolve(response.data.resume);
          } else {
            const error = JSON.parse(xhr.responseText || '{}');
            reject(new Error(error.error || 'Upload failed'));
          }
        });

        xhr.addEventListener("error", () => {
          setUploading(false);
          reject(new Error('Network error'));
        });

        xhr.addEventListener("timeout", () => {
          setUploading(false);
          reject(new Error('Upload timed out. Please try again.'));
        });

        xhr.open("POST", `${BASE}/resume/upload`);
        xhr.timeout = 120000;
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (err) {
      setUploading(false);
      setError(err.message || 'Upload failed');
    }
  };

  return (
    <GlassCard className="p-6" glow={dragActive ? "#00F2FF" : null}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? "border-accent bg-accent/5"
            : "border-white/10 hover:border-accent/30"
        }`}
      >
        <input
          type="file"
          id="resume-upload"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={uploading}
        />

        <div className="relative z-10">
          <motion.div
            animate={{ scale: dragActive ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5"
          >
            <svg
              className="h-8 w-8 text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </motion.div>

          <p className="text-lg font-medium text-white mb-1">
            {file ? file.name : "Drag & drop your resume here"}
          </p>
          <p className="text-sm text-white/50 mb-4">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type}`
              : "PDF, DOC, or DOCX • Max 10MB"}
          </p>

          {file && !uploading && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" onClick={() => setFile(null)} size="sm">
                Remove
              </Button>
              <Button onClick={() => handleUpload()} size="sm">
                Upload Resume
              </Button>
            </div>
          )}

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-white/60">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </div>

        <label htmlFor="resume-upload" className="absolute inset-0 cursor-pointer" />
      </div>
    </GlassCard>
  );
}

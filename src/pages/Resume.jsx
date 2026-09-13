import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import SectionTitle from "../components/ui/SectionTitle";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import ResumeUpload from "../components/resume/ResumeUpload";
import CandidateProfileReview from "../components/resume/CandidateProfileReview";

const BASE = import.meta.env.VITE_API_URL || "/api";
const PARSE_TIMEOUT_MS = 45_000;
const ANALYSIS_TIMEOUT_MS = 90_000;

async function fetchApi(url, options = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        payload.error ||
          payload.message ||
          `Request failed (${response.status})`,
      );
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

const STEPS = [
  { id: "upload", label: "Upload Resume", icon: "📄" },
  { id: "parse", label: "AI Analysis", icon: "🤖" },
  { id: "review", label: "Review Profile", icon: "✅" },
  { id: "setup", label: "Interview Setup", icon: "🎯" },
];

export default function ResumePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [resume, setResume] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  const [profile, setProfile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [interviewConfig, setInterviewConfig] = useState({
    company: "",
    role: "",
    difficulty: "medium",
    type: "mixed",
    durationMinutes: 60,
  });
  const [wizardOptions, setWizardOptions] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState(null);
  const loadExistingResume = async () => {
    try {
      const token = localStorage.getItem("hr_token");

      const response = await fetch(`${BASE}/resume/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const currentResume = data?.data?.resume;

      if (!currentResume) {
        return;
      }

      setResume(currentResume);

      if (currentResume.parsed_data?.cleanedText) {
        setParsedData({
          textLength: currentResume.parsed_data.cleanedText.length,
          sections: currentResume.parsed_data.sections || {},
          preview: currentResume.parsed_data.cleanedText.substring(0, 500),
        });

        setCurrentStep(1);
      }
    } catch (err) {
      console.error("Failed to load existing resume:", err);
    }
  };

  const fetchWizardOptions = async () => {
    try {
      const token = localStorage.getItem("hr_token");
      const response = await fetch(`${BASE}/interview-setup/wizard/options`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWizardOptions(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch wizard options:", err);
    }
  };

  const checkExistingProfile = async () => {
    try {
      const token = localStorage.getItem("hr_token");
      const response = await fetch(`${BASE}/resume/profile/me/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data.exists && data.data.profile) {
          setProfile(data.data.profile);
          setCurrentStep(3); // Go to interview setup
        }
      }
    } catch (err) {
      console.error("Failed to check profile:", err);
    }
  };
  useEffect(() => {
    fetchWizardOptions();
    checkExistingProfile();
    loadExistingResume();
  }, []);

  const handleUploadComplete = async (uploadedResume) => {
  // Clear everything belonging to the previous resume
  setProfile(null);
  setParsedData(null);
  setError(null);
  setParsing(false);
  setAnalyzing(false);

  // Set the new resume
  setResume(uploadedResume);
  setCurrentStep(1);

  await parseAndAnalyze(uploadedResume);
};

  const parseAndAnalyze = async (resumeToProcess) => {
    if (!resumeToProcess?.id) {
      setError("The uploaded resume is missing an ID. Please upload it again.");
      return;
    }

    setParsing(true);
    setAnalyzing(false);
    setError(null);

    try {
      const token = localStorage.getItem("hr_token");
      const data = await fetchApi(
        `${BASE}/resume/${resumeToProcess.id}/parse`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
        PARSE_TIMEOUT_MS,
      );

      const parsed = data?.data?.parsedData;
      if (!parsed || !parsed.textLength) {
        throw new Error(
          "No readable text was found in this resume. Please upload a text-based PDF.",
        );
      }

      setParsedData(parsed);
      setParsing(false);
      await handleAnalyze(resumeToProcess);
    } catch (err) {
      setError(err.message || "Unable to parse the resume.");
    } finally {
      setParsing(false);
    }
  };

  const handleAnalyze = async (resumeToAnalyze = resume) => {
    console.log("[AI] Resume selected for analysis:", resumeToAnalyze);
    if (!resumeToAnalyze?.id) {
      setError(
        "No resume is selected. Please select a stored resume or upload a new one.",
      );
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const token = localStorage.getItem("hr_token");
      const data = await fetchApi(
        `${BASE}/resume/${resumeToAnalyze.id}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            targetRole: interviewConfig.role,
            targetCompany: interviewConfig.company,
          }),
        },
        ANALYSIS_TIMEOUT_MS,
      );

      if (!data?.data?.profile) {
        throw new Error(
          "Analysis completed without creating a candidate profile. Please try again.",
        );
      }
      setProfile(data.data.profile);
      setCurrentStep(2); // Go to review step
    } catch (err) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleProfileSave = (savedProfile) => {
    setProfile(savedProfile);
    setCurrentStep(3); // Go to interview setup
  };

  const handleCreateSession = async () => {
  console.log("CREATE SESSION CLICKED");

  setCreatingSession(true);
  setError(null);

  try {
    const token = localStorage.getItem("hr_token");
    console.log("Token exists:", !!token);

    console.log("Sending session request:", interviewConfig);

    const response = await fetch(`${BASE}/interview-setup/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(interviewConfig),
    });

    console.log("Response received:", response.status, response.statusText);

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    if (!response.ok) {
      throw new Error(responseText);
    }

    const data = JSON.parse(responseText);
    console.log("Parsed session:", data.data);

    const qs = new URLSearchParams({
      sessionId: data.data.interview.id,
      company: interviewConfig.company,
      role: interviewConfig.role,
      difficulty: interviewConfig.difficulty,
      type: interviewConfig.type,
      duration: String(interviewConfig.durationMinutes),
    });

    console.log("Navigating to:", `/interview?${qs.toString()}`);

    navigate(`/interview?${qs.toString()}`);

  } catch (err) {
    console.error("CREATE SESSION ERROR:", err);
    setError(err.message || "Failed to create session");
  } finally {
    setCreatingSession(false);
  }
};

  const handleConfigChange = (field, value) => {
    setInterviewConfig((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!resume;
      case 1:
        return !!profile;
      case 2:
        return !!profile;
      case 3:
        return !!interviewConfig.company && !!interviewConfig.role;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-bg pt-20">
      <Navbar />

      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 z-50 bg-bg/95 backdrop-blur-sm border-b border-white/10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-between h-12">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 ${
                    index <= currentStep ? "text-accent" : "text-white/40"
                  }`}
                >
                  <span className="text-xl">{step.icon}</span>
                  <span className="hidden sm:block text-sm font-medium">
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-px w-16 mx-2 ${
                      index < currentStep ? "bg-accent" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main id="main" className="relative pt-28 pb-12">
        <div className="mx-auto max-w-5xl px-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-400/10 border border-red-400/30 text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Step 0: Upload Resume */}
              {currentStep === 0 && (
                <div>
                  <SectionTitle
                    title="Upload Your Resume"
                    gradient={["Upload"]}
                    subtitle="Upload a text-based PDF. We'll extract and analyze your experience."
                  />
                  <ResumeUpload onUploadComplete={handleUploadComplete} />
                  <div className="text-center text-white/50 text-sm">
                    Maximum file size: 10MB • Supported formats: PDF, DOC, DOCX
                  </div>
                </div>
              )}

              {/* Step 1: AI Analysis */}
              {currentStep === 1 && (
                <div>
                  <SectionTitle
                    title="AI Resume Analysis"
                    gradient={["AI Analysis"]}
                    subtitle="Our AI will parse your resume and build a comprehensive candidate profile."
                  />

                  {profile ? (
                    <GlassCard className="p-6 text-center" glow="#34D399">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20"
                      >
                        <svg
                          className="h-8 w-8 text-emerald-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Analysis Complete!
                      </h3>
                      <p className="text-white/60 mb-6">
                        Your candidate profile has been created. Review it in
                        the next step.
                      </p>
                      <Button onClick={() => setCurrentStep(2)} size="lg">
                        Review Profile
                      </Button>
                    </GlassCard>
                  ) : (
                    <>
                      {resume && parsing && (
                        <GlassCard className="p-6 text-center" glow="#00F2FF">
                          <h3 className="text-xl font-bold text-white mb-2">
                            Parsing Your Resume
                          </h3>
                          <p className="text-white/60">
                            Extracting readable text before AI analysis...
                          </p>
                        </GlassCard>
                      )}

                      {resume && !parsedData && !parsing && !analyzing && (
                        <GlassCard className="p-6">
                          <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                              <span className="text-3xl">🤖</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                              Ready for AI Analysis
                            </h3>
                            <p className="text-white/60 mb-6">
                              Resume uploaded: <strong>{resume.title}</strong>{" "}
                              (v{resume.version})
                            </p>
                            <p className="text-sm text-red-300 mb-4">
                              Parsing did not complete.
                            </p>
                            <Button
                              onClick={() => parseAndAnalyze(resume)}
                              size="lg"
                            >
                              Retry parsing
                            </Button>
                          </div>
                        </GlassCard>
                      )}

                      {parsedData && !profile && !analyzing && !parsing && (
                        <GlassCard className="p-6">
                          <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                              <span className="text-3xl">🤖</span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">
                              Ready for AI Analysis
                            </h3>

                            <p className="text-white/60 mb-2">
                              Resume uploaded: <strong>{resume.title}</strong>{" "}
                              (v{resume.version})
                            </p>

                            <p className="text-xs text-white/30 mb-4">
                              Resume ID: {resume.id || "Missing"}
                            </p>

                            <div className="flex items-center justify-center gap-3">
                              <input
                                placeholder="Target Role (optional)"
                                value={interviewConfig.role}
                                onChange={(e) =>
                                  handleConfigChange("role", e.target.value)
                                }
                                className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
                              />

                              <input
                                placeholder="Target Company (optional)"
                                value={interviewConfig.company}
                                onChange={(e) =>
                                  handleConfigChange("company", e.target.value)
                                }
                                className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
                              />
                            </div>

                            <Button
                              onClick={() => handleAnalyze(resume)}
                              size="lg"
                              className="mt-4"
                              disabled={analyzing || !resume?.id}
                            >
                              {analyzing ? "Analyzing..." : "Start AI Analysis"}
                            </Button>
                          </div>
                        </GlassCard>
                      )}

                      {analyzing && (
                        <GlassCard className="p-8 text-center" glow="#00F2FF">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan-400"
                          >
                            <span className="text-2xl">🤖</span>
                          </motion.div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            Analyzing Your Resume
                          </h3>
                          <p className="text-white/60">
                            Our AI is extracting your skills, experience, and
                            building your candidate profile...
                          </p>
                          <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-accent to-cyan-400"
                              animate={{ width: ["0%", "100%"] }}
                              transition={{ duration: 10, ease: "linear" }}
                            />
                          </div>
                        </GlassCard>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Review Profile */}
              {currentStep === 2 && profile && (
                <CandidateProfileReview
                  profile={profile}
                  onSave={handleProfileSave}
                  onCancel={() => setCurrentStep(1)}
                  editable
                />
              )}

              {/* Step 3: Interview Setup Wizard */}
              {currentStep === 3 && (
                <InterviewSetupWizard
                  profile={profile}
                  config={interviewConfig}
                  onConfigChange={handleConfigChange}
                  onCreateSession={handleCreateSession}
                  creatingSession={creatingSession}
                  wizardOptions={wizardOptions}
                  onBack={() => setCurrentStep(2)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              ← Back
            </Button>
            <Button
              onClick={() =>
                setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))
              }
              disabled={!canProceed() || currentStep === STEPS.length - 1}
            >
              {currentStep === STEPS.length - 1
                ? "Create Session"
                : "Continue →"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Interview Setup Wizard Component
function InterviewSetupWizard({
  profile,
  config,
  onConfigChange,
  onCreateSession,
  creatingSession,
  wizardOptions,
  onBack,
}) {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Interview Setup Wizard"
        gradient={["Interview Setup"]}
        subtitle="Configure your interview session. The AI will use this context to generate tailored questions."
      />

      {/* Profile Summary */}
      <GlassCard className="p-4" glow="#A78BFA">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#60a5fa] text-xl font-bold text-bg">
            👤
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">
              {profile.full_name || "Candidate"}
            </h3>
            <p className="text-sm text-white/60">
              {profile.analysis?.primaryRole ||
                profile.preferred_role ||
                "Software Engineer"}{" "}
              · {profile.analysis?.totalYearsExperience || 0}+ years
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.analysis?.strongAreas?.slice(0, 3).map((area, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-emerald-400/20 text-emerald-400 border border-emerald-400/30"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-accent">
              {profile.analysis?.seniorityLevel || "Mid"}
            </p>
            <p className="text-xs text-white/50">Seniority Level</p>
          </div>
        </div>
      </GlassCard>

      {/* Company & Role */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">
          Company & Role
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
              Target Company
            </label>
            <input
              type="text"
              value={config.company}
              onChange={(e) => onConfigChange("company", e.target.value)}
              placeholder="e.g., Google, Microsoft, Stripe"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
              Target Role
            </label>
            <input
              type="text"
              value={config.role}
              onChange={(e) => onConfigChange("role", e.target.value)}
              placeholder="e.g., Senior Backend Engineer"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
            />
          </div>
        </div>
      </GlassCard>

      {/* Interview Configuration */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">
          Interview Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
              Difficulty
            </label>
            <select
              value={config.difficulty}
              onChange={(e) => onConfigChange("difficulty", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent/50 focus:outline-none appearance-none"
            >
              {wizardOptions?.difficulties?.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
              Interview Type
            </label>
            <select
              value={config.type}
              onChange={(e) => onConfigChange("type", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent/50 focus:outline-none appearance-none"
            >
              {wizardOptions?.types?.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
              Duration
            </label>
            <select
              value={config.durationMinutes}
              onChange={(e) =>
                onConfigChange("durationMinutes", parseInt(e.target.value))
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent/50 focus:outline-none appearance-none"
            >
              {wizardOptions?.durations?.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Difficulty Description */}
        {wizardOptions?.difficulties && (
          <p className="mt-4 text-sm text-white/50">
            {
              wizardOptions.difficulties.find(
                (d) => d.value === config.difficulty,
              )?.description
            }
          </p>
        )}
      </GlassCard>

      {/* AI Context Preview */}
      <GlassCard className="p-6" glow="#00F2FF">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">
          Interview Context Preview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <ContextRow
              label="Candidate"
              value={`${profile.analysis?.seniorityLevel || "Mid"} ${profile.analysis?.primaryRole || "Engineer"}`}
            />
            <ContextRow
              label="Experience"
              value={`${profile.analysis?.totalYearsExperience || 0} years`}
            />
            <ContextRow
              label="Top Skills"
              value={profile.skills?.technical?.slice(0, 5).join(", ") || "—"}
            />
            <ContextRow
              label="Strong Areas"
              value={
                profile.analysis?.strongAreas?.slice(0, 3).join(", ") || "—"
              }
            />
            <ContextRow
              label="Weak Areas"
              value={profile.analysis?.weakAreas?.slice(0, 3).join(", ") || "—"}
            />
            <ContextRow
              label="Focus Areas"
              value={
                profile.analysis?.interviewFocusAreas?.slice(0, 3).join(", ") ||
                "—"
              }
            />
          </div>
          <div className="space-y-3">
            <ContextRow label="Company" value={config.company || "Not set"} />
            <ContextRow label="Role" value={config.role || "Not set"} />
            <ContextRow label="Difficulty" value={config.difficulty} />
            <ContextRow label="Type" value={config.type.replace("_", " ")} />
            <ContextRow
              label="Duration"
              value={`${config.durationMinutes} minutes`}
            />
            <ContextRow
              label="Est. Questions"
              value={Math.ceil(config.durationMinutes / 5)}
            />
          </div>
        </div>
      </GlassCard>

      {/* Create Session */}
      <div className="flex justify-end">
        <Button
          onClick={onCreateSession}
          disabled={creatingSession || !config.company || !config.role}
          size="lg"
        >
          {creatingSession ? "Creating Session..." : "Create Interview Session"}
        </Button>
      </div>
    </div>
  );
}

function ContextRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-sm font-medium text-white truncate max-w-[60%] text-right">
        {value}
      </span>
    </div>
  );
}

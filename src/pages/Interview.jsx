import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import SpeechRecorder from "../components/Interview/SpeechRecorder";

const BASE = import.meta.env.VITE_API_URL || "/api";

const VALID_STATUS = [
  "loading",
  "ready",
  "question",
  "listening",
  "ended",
  "error",
];

export default function InterviewPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [error, setError] = useState(null);
  const [messageId, setMessageId] = useState(null);
  const [report, setReport] = useState(null);
  const [evaluationReady, setEvaluationReady] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: "pending",
    microphone: "pending",
  });

  // Interview config from query params (passed from Resume wizard)
  const sessionId = params.get("sessionId");
  const company = params.get("company") || "HireReady";
  const role = params.get("role") || "Software Engineer";
  const difficulty = params.get("difficulty") || "medium";
  const type = params.get("type") || "mixed";
  const duration = parseInt(params.get("duration") || "30", 10);
  const resumeId = params.get("resumeId") || null;
  useEffect(() => {
    console.log("Interview page loaded");
    console.log("Session ID:", sessionId);
    console.log("Company:", company);
    console.log("Role:", role);
  }, [sessionId, company, role]);
  const timerRef = useRef(null);
  const interviewEndedRef = useRef(false);
  const conversationEndRef = useRef(null);
  const interviewStarted = useRef(false);
  const mediaStreamRef = useRef(null);
  const videoRef = useRef(null);
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [conversation]);

  const stopMedia = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  /**
   * Start the real AI interview by calling POST /api/interview/start
   */
  const startInterview = useCallback(async () => {
    try {
      if (!sessionId) {
        throw new Error("Interview session ID is missing.");
      }

      const token = localStorage.getItem("hr_token");

      console.log("[INTERVIEW] Loading existing session:", sessionId);

      const res = await fetch(`${BASE}/interview-setup/sessions/${sessionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await res.text();

      console.log("[INTERVIEW] Session response:", res.status, responseText);

      if (!res.ok) {
        throw new Error(
          responseText.includes("{")
            ? JSON.parse(responseText).error || responseText
            : responseText,
        );
      }

      const data = JSON.parse(responseText);
      const session = data.data;

      console.log("[INTERVIEW] Existing session loaded:", session);

      const interviewData = session.interview || session;

      const context = session.interviewContext || session.context || null;

      const contextId =
        context?.id || interviewData.metadata?.contextId || null;

      if (!contextId) {
        throw new Error("Interview context not found for this session.");
      }

      const normalizedInterview = {
        ...interviewData,
        interviewId: interviewData.id,
        contextId,
      };

      setInterview(normalizedInterview);

      // Use the duration stored in the interview session
      const interviewDuration = interviewData.duration_minutes || duration;

      setRemainingTime(interviewDuration * 60);

      console.log("[INTERVIEW] Context ID:", contextId);
      console.log("[INTERVIEW] Interview ready");

      setStatus("ready");
    } catch (err) {
      console.error("[INTERVIEW] Failed to load session:", err);
      setError(err.message || "Failed to load interview session");
      setStatus("error");
    }
  }, [sessionId, duration]);

  useEffect(() => {
    if (!sessionId) {
      setError("Interview session ID is missing.");
      setStatus("error");
      return;
    }

    if (interviewStarted.current) return;

    interviewStarted.current = true;

    startInterview();
  }, [sessionId, startInterview]);

  const requestPermissionsAndStart = useCallback(async () => {
    setError(null);
    setPermissions({
      camera: "checking",
      microphone: "checking",
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setPermissions({
        camera: "ready",
        microphone: "ready",
      });

      setStatus("ready");
    } catch (err) {
      stopMedia();

      setPermissions({
        camera: "denied",
        microphone: "denied",
      });

      setError(
        "Camera and microphone access is required. Enable both permissions in your browser settings, then try again.",
      );

      setStatus("error");
    }
  }, [stopMedia]);

  /**
   * Fetch the next question from the AI interviewer
   */
  const fetchNextQuestion = useCallback(async () => {
    try {
      const token = localStorage.getItem("hr_token");
      const res = await fetch(`${BASE}/interview/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contextId: interview.contextId }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const question = data.data;
      setCurrentQuestion(question);
      setMessageId(question.messageId || null);
      setStatus("question");
    } catch (err) {
      console.error("Failed to get next question:", err);
      setError(err.message || "Failed to get next question");
    }
  }, [interview]);

  const handleNextQuestion = useCallback(() => {
    console.log("[INTERVIEW] Moving to next question...");

    setEvaluationReady(false);
    setStatus("loading");
    setCurrentQuestion(null);
    setMessageId(null);

    fetchNextQuestion();
  }, [fetchNextQuestion]);

  /**
   * End the interview and generate the final report
   */
  const handleEndInterview = useCallback(async () => {
    // Immediately prevent any pending follow-up question
    console.log("[INTERVIEW] handleEndInterview CALLED");
    interviewEndedRef.current = true;

    try {
      setStatus("loading");

      // Stop timer immediately
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const token = localStorage.getItem("hr_token");
      console.log("[INTERVIEW] Sending end request:", {
        contextId: interview.contextId,
      });

      const res = await fetch(`${BASE}/interview/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contextId: interview.contextId,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      console.log("[INTERVIEW] End response:", data);

      setReport(data.data);
      setStatus("ended");
    } catch (err) {
      console.error("Failed to end interview:", err);
      setError(err.message || "Failed to end interview");
      setStatus("error");
    }
  }, [interview]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopMedia();
    };
  }, [stopMedia]);

  /**
   * Countdown timer
   */
  useEffect(() => {
    if (status !== "question" && status !== "ready") return;

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        console.log("[INTERVIEW TIMER]", prev);
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [status, handleEndInterview]);

  /**
   * Handle transcript from SpeechRecorder
   */
  const handleStatusChange = (data) => {
    if (data.type === "transcript") {
      setConversation((prev) => {
        const updated = [...prev];

        // Find the most recent user answer.
        const lastIndex = updated.length - 1;

        if (lastIndex >= 0 && updated[lastIndex].role === "user") {
          // Update the existing answer instead of creating
          // another chat message.
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: data.transcript,
          };

          return updated;
        }

        // First transcript update for this answer.
        updated.push({
          role: "user",
          content: data.transcript,
        });

        return updated;
      });
    }

    if (data.type === "evaluation") {
      console.log("[INTERVIEW] Evaluation received:", data.evaluation);

      setConversation((prev) => [
        ...prev,
        {
          role: "evaluation",
          content: data.evaluation,
        },
      ]);

      // Wait for the candidate to click "Next Question"
      setEvaluationReady(true);
    }
  };

  /**
   * Submit the answer to the current question and fetch the next one
   */

  // Format remaining time as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Render
  return (
    <div className="min-h-screen bg-bg pt-20">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="mt-4 text-white/60">
                Starting your AI interview...
              </p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center"
            >
              <GlassCard className="p-8" glow="#ef4444">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Interview failed to start
                </h2>
                <p className="text-white/60 mb-6">{error}</p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => {
                      setError(null);
                      setStatus("loading");
                      startInterview();
                    }}
                  >
                    Retry
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/resume")}>
                    Back to Resume
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {(status === "ready" ||
            status === "question" ||
            status === "listening") &&
            interview && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {interview.company} · {interview.role}
                    </h1>
                    <p className="text-sm text-white/50">
                      Difficulty: {interview.difficulty || difficulty} · Type:{" "}
                      {(interview.interviewType || type).replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        remainingTime < 60
                          ? "bg-red-500/20 text-red-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      ⏱ {formatTime(remainingTime)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEndInterview}
                    >
                      End Interview
                    </Button>
                  </div>
                </div>

                {/* Question */}
                {currentQuestion ? (
                  <GlassCard className="p-6" glow="#00F2FF">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
                      {currentQuestion.type === "first"
                        ? "First Question"
                        : "Follow-up Question"}
                    </div>
                    <p className="text-lg text-white leading-relaxed">
                      {currentQuestion.question}
                    </p>
                    {currentQuestion.topic && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/70">
                          #{currentQuestion.topic}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/70">
                          Difficulty: {currentQuestion.difficulty}
                        </span>
                      </div>
                    )}
                  </GlassCard>
                ) : (
                  <GlassCard className="p-6 text-center">
                    <p className="text-white/70">
                      Click below to get your first question.
                    </p>
                    <Button className="mt-4" onClick={fetchNextQuestion}>
                      Get First Question
                    </Button>
                  </GlassCard>
                )}

                {/* Speech Recorder */}
                <GlassCard className="p-0 overflow-hidden">
                  <SpeechRecorder
                    interviewId={interview.interviewId}
                    contextId={interview.contextId}
                    questionId={messageId}
                    onStatusChange={handleStatusChange}
                    isQuestionActive={
                      status === "question" || status === "listening"
                    }
                  />
                </GlassCard>

                {/* Conversation Log (compact) */}
                {conversation.length > 0 && (
                  <div className="max-h-[500px] overflow-y-auto space-y-3 rounded-xl bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                      Interview Activity
                    </p>

                    {conversation.map((msg, i) => {
                      // Normal user transcript
                      if (msg.role === "user") {
                        return (
                          <p key={i} className="text-sm text-accent">
                            <strong>You:</strong> {msg.content}
                          </p>
                        );
                      }

                      // AI evaluation object
                      if (msg.role === "evaluation") {
                        const evaluation = msg.content;

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-xl border border-accent/30 bg-accent/5 p-5 shadow-lg"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-accent font-semibold">
                                  AI Analysis
                                </p>

                                <h3 className="text-lg font-semibold text-white">
                                  Answer Evaluation
                                </h3>
                              </div>

                              <div className="text-right">
                                <div className="text-3xl font-bold text-accent">
                                  {evaluation?.score ?? 0}
                                </div>

                                <div className="text-xs text-white/50">
                                  / 100
                                </div>
                              </div>
                            </div>

                            {/* Score bar */}
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, evaluation?.score ?? 0),
                                  )}%`,
                                }}
                                transition={{ duration: 0.6 }}
                                className="h-full bg-accent rounded-full"
                              />
                            </div>

                            {/* Feedback */}
                            {evaluation?.feedback && (
                              <div className="mb-5">
                                <p className="text-sm font-semibold text-white mb-1">
                                  Overall Feedback
                                </p>

                                <p className="text-sm text-white/70 leading-relaxed">
                                  {evaluation.feedback}
                                </p>
                              </div>
                            )}

                            {/* Strengths */}
                            {evaluation?.strengths?.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-emerald-400 mb-2">
                                  ✓ Strengths
                                </p>

                                <ul className="space-y-1">
                                  {evaluation.strengths.map((item, index) => (
                                    <li
                                      key={index}
                                      className="text-sm text-white/70 pl-2"
                                    >
                                      • {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Mistakes */}
                            {evaluation?.mistakes?.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-red-400 mb-2">
                                  ⚠ Areas to Improve
                                </p>

                                <ul className="space-y-1">
                                  {evaluation.mistakes.map((item, index) => (
                                    <li
                                      key={index}
                                      className="text-sm text-white/70 pl-2"
                                    >
                                      • {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Suggestions */}
                            {evaluation?.suggestions?.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-yellow-400 mb-2">
                                  → Suggestions
                                </p>

                                <ul className="space-y-1">
                                  {evaluation.suggestions.map((item, index) => (
                                    <li
                                      key={index}
                                      className="text-sm text-white/70 pl-2"
                                    >
                                      • {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {evaluationReady && (
                              <div className="mt-6 pt-5 border-t border-white/10 flex justify-end">
                                <button
                                  onClick={handleNextQuestion}
                                  className="px-5 py-2.5 rounded-lg bg-accent text-black font-semibold hover:opacity-90 transition"
                                >
                                  Next Question →
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      }

                      // Fallback for any other message type
                      return (
                        <p key={i} className="text-sm text-white/60">
                          <strong>AI:</strong>{" "}
                          {typeof msg.content === "string"
                            ? msg.content
                            : JSON.stringify(msg.content)}
                        </p>
                      );
                    })}
                    <div ref={conversationEndRef} />
                  </div>
                )}
              </motion.div>
            )}

          {status === "ended" && report && (
            <motion.div
              key="ended"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-10"
            >
              <GlassCard className="p-8" glow="#34D399">
                <div className="text-center mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
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
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Interview Complete!
                  </h2>
                  <p className="text-white/60">
                    Your AI evaluation has been generated.
                  </p>
                </div>

                {report.overallScore && (
                  <div className="mb-6 text-center">
                    <span className="text-5xl font-bold text-accent">
                      {report.overallScore}%
                    </span>
                    <p className="text-sm text-white/50 mt-1">Overall Score</p>
                  </div>
                )}

                {report.summary && (
                  <p className="mb-6 text-white/80 leading-relaxed">
                    {report.summary}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {report.strengths?.length > 0 && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                      <h3 className="font-semibold text-emerald-400 mb-2">
                        Strengths
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                        {report.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.weaknesses?.length > 0 && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                      <h3 className="font-semibold text-red-400 mb-2">
                        Areas to Improve
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                        {report.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Button onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/resume")}>
                    Back to Resume
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

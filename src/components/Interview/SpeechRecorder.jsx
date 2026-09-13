// SpeechRecorder Component - main speech recognition interface
import React, { useRef, useEffect, useState } from "react";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";
import TranscriptBox from "./TranscriptBox";
import MicStatus from "./MicStatus";
import SpeechService from "../../services/speech.service";

const SpeechRecorder = ({
  interviewId,
  contextId,
  questionId,
  onStatusChange,
  onQuestion,
  isQuestionActive,
}) => {
  const autoSaveRef = useRef(null);
  const stopTimeoutRef = useRef(null);

  // Prevent duplicate answer submissions
  const submittedRef = useRef(false);

  // Always keeps the latest transcript available,
  // even before React state finishes updating.
  const latestTranscriptRef = useRef("");

  // Prevent multiple auto-submit timers
  const silenceTimerRef = useRef(null);

  // API processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Silence countdown state
  const [silenceSeconds, setSilenceSeconds] = useState(null);

  // --------------------------------------------------
  // Speech recognition configuration
  // --------------------------------------------------

  const speechParams = {
    continuous: true,
    interimResults: true,
    language: "en-US",

    autoSaveInterval: 3000,

    // We don't rely on the hook's silence timeout
    // to submit the answer.
    //
    // SpeechRecorder handles the interview-level
    // 7-second answer timeout.
    maxSilenceTimeout: 7000,
  };

  const {
    isSupported,
    isListening,
    isRecording,
    isPaused,
    transcript,
    interimTranscript,
    error,
    wordCount,
    elapsedTime,
    start,
    stop,
    pause,
    resume,
    clear,
  } = useSpeechRecognition({
    ...speechParams,

    // --------------------------------------------------
    // Live transcript
    // --------------------------------------------------

    onTranscriptUpdate: (fullTranscript) => {
      // Keep the latest transcript outside React state.
      // This prevents the Stop button from reading stale data.
      latestTranscriptRef.current = fullTranscript || "";

      // Any new speech means the candidate is actively
      // answering again.
      setSilenceSeconds(null);

      if (onStatusChange) {
        onStatusChange({
          type: "transcript",
          transcript: fullTranscript,
        });
      }
    },

    // --------------------------------------------------
    // Final speech segment
    //
    // IMPORTANT:
    // Do NOT submit the answer here.
    //
    // Web Speech API can mark a small speech segment
    // as "final" even though the candidate is still
    // answering.
    // --------------------------------------------------

    onFinalTranscript: (finalTranscript) => {
      console.log("[SPEECH] Final speech segment received:", finalTranscript);

      // Do NOT send this to Interview.jsx as a new transcript.
      //
      // onTranscriptUpdate already provides the complete transcript.
      // This callback represents only a browser-recognition segment,
      // not the completed interview answer.

      setSilenceSeconds(null);
    },

    // --------------------------------------------------
    // Recognition error
    // --------------------------------------------------

    onError: (err) => {
      console.error("[SPEECH] Recognition error:", err);

      if (onStatusChange) {
        onStatusChange({
          type: "error",
          error: err,
        });
      }
    },
  });

  // --------------------------------------------------
  // Submit completed answer
  // --------------------------------------------------

  const submitAnswer = async (finalTranscript) => {
    if (!finalTranscript?.trim()) {
      console.warn("[SPEECH] Cannot submit empty answer.");

      setIsProcessing(false);
      return;
    }

    if (!interviewId || !contextId || !questionId) {
      console.error("[SPEECH] Missing interview IDs:", {
        interviewId,
        contextId,
        questionId,
      });

      setIsProcessing(false);
      return;
    }

    // Prevent duplicate submissions
    if (submittedRef.current) {
      console.warn("[SPEECH] Answer already submitted.");
      return;
    }

    submittedRef.current = true;
    setIsProcessing(true);

    // Stop silence countdown
    clearInterval(silenceTimerRef.current);
    setSilenceSeconds(null);

    console.log("[SPEECH] Submitting completed answer...");

    console.log("[SPEECH] IDs:", {
      interviewId,
      contextId,
      questionId,
    });

    try {
      const endTime = Date.now();

      const responseDuration = Math.max(0, elapsedTime);

      const calculatedStartTime = endTime - responseDuration;

      const result = await SpeechService.submitTranscript({
        interviewId,
        contextId,
        questionId,

        transcript: finalTranscript.trim(),

        startTime: calculatedStartTime,
        endTime,

        responseDuration,

        wordCount: finalTranscript.trim().split(/\s+/).filter(Boolean).length,

        topic: "general",
        difficulty: "medium",
      });

      console.log("[SPEECH] Answer submitted successfully:", result);

      const evaluation = result?.data?.evaluation || null;

      if (onStatusChange) {
        onStatusChange({
          type: "evaluation",
          evaluation,
          transcript: finalTranscript.trim(),
        });
      }
    } catch (err) {
      console.error("[SPEECH] Error submitting answer:", err);

      // Allow retry if API failed
      submittedRef.current = false;

      if (onStatusChange) {
        onStatusChange({
          type: "error",
          error: err,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // --------------------------------------------------
  // Manual Stop
  // --------------------------------------------------

  const handleStop = async () => {
    if (isProcessing) {
      return;
    }

    console.log("[SPEECH] Manual Stop clicked.");

    clearInterval(silenceTimerRef.current);
    setSilenceSeconds(null);

    // Stop browser recognition.
    stop();

    // Read from ref because React state may still be stale
    // immediately after stop().
    const finalAnswer = latestTranscriptRef.current.trim();

    console.log("[SPEECH] Final answer:", finalAnswer);

    await submitAnswer(finalAnswer);
  };

  // --------------------------------------------------
  // Automatic silence submission
  // --------------------------------------------------
  const handleSilenceTimeout = async () => {
    if (isProcessing || submittedRef.current || !isRecording) {
      return;
    }

    console.log("[SPEECH] Silence limit reached. Auto-submitting answer...");

    clearInterval(silenceTimerRef.current);
    setSilenceSeconds(null);

    // Stop recognition first
    stop();

    // Read the latest transcript from the ref.
    const finalAnswer = latestTranscriptRef.current.trim();

    await submitAnswer(finalAnswer);
  };

  // --------------------------------------------------
  // Start
  // --------------------------------------------------

  const handleStart = () => {
    if (isProcessing) {
      return;
    }

    if (!questionId) {
      console.warn("[SPEECH] Cannot start: question ID missing.");
      return;
    }

    console.log("[SPEECH] Starting new answer...");

    submittedRef.current = false;
    latestTranscriptRef.current = "";

    clearInterval(silenceTimerRef.current);
    setSilenceSeconds(null);

    start();
  };

  // --------------------------------------------------
  // Toggle Start / Stop
  // --------------------------------------------------

  const handleToggleRecording = () => {
    if (isProcessing) {
      return;
    }

    if (isRecording) {
      handleStop();
      return;
    }

    handleStart();
  };

  // --------------------------------------------------
  // Silence detection
  //
  // We use the interim transcript as the signal that
  // speech is currently happening.
  //
  // Once the candidate stops producing transcript
  // updates, we start a 7-second countdown.
  // --------------------------------------------------

  useEffect(() => {
    if (!isRecording || isPaused || isProcessing) {
      clearInterval(silenceTimerRef.current);
      setSilenceSeconds(null);
      return;
    }

    let silenceTimeout = null;

    const startSilenceCountdown = () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
      }

      let remaining = 7;

      setSilenceSeconds(remaining);

      silenceTimerRef.current = setInterval(() => {
        remaining -= 1;

        if (remaining <= 0) {
          clearInterval(silenceTimerRef.current);

          setSilenceSeconds(0);

          handleSilenceTimeout();
          return;
        }

        setSilenceSeconds(remaining);
      }, 1000);
    };

    /*
     * IMPORTANT:
     *
     * A final transcript does not necessarily mean
     * the answer is finished.
     *
     * We only start the countdown after the browser
     * reports that speech has ended through the hook.
     *
     * The hook's isListening state gives us the browser
     * recognition state.
     */

    if (!isListening && transcript.trim()) {
      silenceTimeout = setTimeout(() => {
        if (!isListening && isRecording && !isPaused && !isProcessing) {
          startSilenceCountdown();
        }
      }, 100);
    }

    return () => {
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
    };
  }, [isListening, isRecording, isPaused, isProcessing, transcript]);

  // --------------------------------------------------
  // Cancel silence countdown whenever candidate speaks
  // --------------------------------------------------

  useEffect(() => {
    if (isListening) {
      clearInterval(silenceTimerRef.current);

      setSilenceSeconds(null);
    }
  }, [isListening]);

  // --------------------------------------------------
  // Auto-save interim transcript
  // --------------------------------------------------

  useEffect(() => {
    if (
      interimTranscript &&
      !error &&
      isRecording &&
      !isPaused &&
      !isProcessing
    ) {
      autoSaveRef.current = setTimeout(() => {
        SpeechService.autoSaveTranscript({
          interviewId,
          contextId,
          questionId,
          transcript: interimTranscript,
          isFinal: false,
          startTime: Date.now() - elapsedTime,
        }).catch((saveErr) =>
          console.error("[SPEECH] Auto-save error:", saveErr),
        );
      }, 3000);
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [
    interimTranscript,
    interviewId,
    contextId,
    questionId,
    isRecording,
    isPaused,
    isProcessing,
    error,
    elapsedTime,
  ]);

  // --------------------------------------------------
  // Stop when question becomes inactive
  // --------------------------------------------------

  useEffect(() => {
    if (!isQuestionActive && isRecording && !isProcessing) {
      stopTimeoutRef.current = setTimeout(() => {
        stop();
      }, 1000);
    }

    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
    };
  }, [isQuestionActive, isRecording, isProcessing, stop]);

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      clearTimeout(autoSaveRef.current);
      clearTimeout(stopTimeoutRef.current);
      clearInterval(silenceTimerRef.current);

      stop();
    };
  }, [stop]);

  // --------------------------------------------------
  // Reset
  // --------------------------------------------------

  const handleReset = () => {
    if (isProcessing) {
      return;
    }

    console.log("[SPEECH] Resetting recording...");

    submittedRef.current = false;
    latestTranscriptRef.current = "";

    clearInterval(silenceTimerRef.current);

    setSilenceSeconds(null);

    clear();
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="flex flex-col h-full space-y-5 bg-gray-900 text-white p-4 overflow-hidden">
      {/* Mic Status */}
      <div className="w-full max-w-md mx-auto text-center">
        <MicStatus
          isListening={isListening}
          isRecording={isRecording}
          isPaused={isPaused}
          isSupported={isSupported}
          error={error}
        />
      </div>

      {/* Live Transcript */}
      <TranscriptBox
        transcript={transcript}
        interimTranscript={interimTranscript}
        isFinal={!isRecording || !!error}
        isRecording={isRecording}
        error={error}
      />

      {/* Silence warning */}
      {silenceSeconds !== null && isRecording && !isPaused && !isProcessing && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-900/70 border border-yellow-600 text-yellow-200 text-sm">
            <span>⚠️</span>

            <span>
              No speech detected. Auto-submit in{" "}
              <strong>{silenceSeconds}s</strong>
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
        <div className="flex flex-1 space-x-4">
          {/* Start / Stop */}
          <button
            onClick={handleToggleRecording}
            disabled={!isSupported || isProcessing}
            className={`px-4 py-2 text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed ${
              isProcessing
                ? "bg-gray-600"
                : isRecording
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {isProcessing ? "Evaluating..." : isRecording ? "Stop" : "Start"}
          </button>

          {/* Pause / Resume */}
          {isRecording && !isProcessing && (
            <button
              onClick={() => (isPaused ? resume() : pause())}
              className="px-4 py-2 bg-yellow-700 text-sm font-medium rounded hover:bg-yellow-800"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
          )}

          {/* Reset */}
          {!isRecording && !isProcessing && (
            <button
              onClick={handleReset}
              disabled={!transcript}
              className="px-4 py-2 bg-gray-600 text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          )}
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="text-sm text-yellow-300">⏳ Evaluating answer...</div>
        )}
      </div>

      {/* Status / Stats */}
      <div className="text-xs opacity-70 flex items-center space-x-2 justify-end">
        {error && (
          <span className="text-red-300 font-medium bg-red-900 px-2 py-1 rounded">
            {typeof error === "string"
              ? error
              : error?.message || "Speech recognition error"}
          </span>
        )}

        <span>Duration: {Math.floor(elapsedTime / 1000)}s</span>

        <span>Words: {wordCount}</span>
      </div>
    </div>
  );
};

export default SpeechRecorder;

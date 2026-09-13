// Custom hook for Web Speech API integration
// Provides stable speech recognition with start/stop, pause/resume,
// silence handling, timer, transcript and browser-state synchronization.

import { useState, useEffect, useCallback, useRef } from "react";

const useSpeechRecognition = (options = {}) => {
  const {
    onTranscriptUpdate,
    onFinalTranscript,
    onStart,
    onStop,
    onError,
    onAutoSave,
    continuous = true,
    interimResults = true,
    language = "en-US",
    autoSaveInterval = 3000,
    maxSilenceTimeout = 5000,
  } = options;

  // --------------------------------------------------
  // React state
  // --------------------------------------------------

  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  const [confidence, setConfidence] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // --------------------------------------------------
  // Refs
  // --------------------------------------------------

  const recognitionRef = useRef(null);

  const autoSaveRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  const transcriptHistoryRef = useRef([]);
  const finalTranscriptRef = useRef("");

  // Browser recognition state
  const recognitionRunningRef = useRef(false);
  const shouldBeRecordingRef = useRef(false);
  const manuallyStoppedRef = useRef(false);

  // Prevent duplicate final processing
  const lastFinalTranscriptRef = useRef("");

  // Keep latest callback references without forcing
  // SpeechRecognition instance to be recreated.
  const callbacksRef = useRef({
    onTranscriptUpdate,
    onFinalTranscript,
    onStart,
    onStop,
    onError,
    onAutoSave,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTranscriptUpdate,
      onFinalTranscript,
      onStart,
      onStop,
      onError,
      onAutoSave,
    };
  }, [
    onTranscriptUpdate,
    onFinalTranscript,
    onStart,
    onStop,
    onError,
    onAutoSave,
  ]);

  // --------------------------------------------------
  // Initialize Speech Recognition
  // --------------------------------------------------

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsSupported(false);
      setError("Speech Recognition is not supported.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError(
        "Speech Recognition is not supported in this browser."
      );
      return;
    }

    const instance = new SpeechRecognition();

    instance.continuous = continuous;
    instance.interimResults = interimResults;
    instance.lang = language;

    recognitionRef.current = instance;
    setIsSupported(true);

    // --------------------------------------------------
    // Recognition started
    // --------------------------------------------------

    instance.onstart = () => {
      console.log("[SPEECH] Browser recognition started");

      recognitionRunningRef.current = true;

      setIsListening(true);
      setIsRecording(true);
      setError(null);

      // Only create start time when a new recording starts.
      if (!startTime) {
        const now = Date.now();

        setStartTime(now);
        setEndTime(null);
        setElapsedTime(0);
      }

      callbacksRef.current.onStart?.();
    };

    // --------------------------------------------------
    // Recognition ended
    // --------------------------------------------------

    instance.onend = () => {
      console.log("[SPEECH] Browser recognition ended");

      recognitionRunningRef.current = false;

      clearTimeout(silenceTimeoutRef.current);

      setIsListening(false);

      // If application still wants recording,
      // restart recognition automatically.
      //
      // This is important because Chrome can terminate
      // SpeechRecognition even when continuous=true.
      if (
        shouldBeRecordingRef.current &&
        !manuallyStoppedRef.current
      ) {
        console.log(
          "[SPEECH] Recognition ended unexpectedly. Restarting..."
        );

        setTimeout(() => {
          if (
            recognitionRef.current &&
            shouldBeRecordingRef.current &&
            !recognitionRunningRef.current
          ) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.warn(
                "[SPEECH] Restart failed:",
                err
              );
            }
          }
        }, 200);
      } else {
        setIsRecording(false);
        setIsPaused(false);

        const now = Date.now();

        setEndTime(now);

        callbacksRef.current.onStop?.();
      }
    };

    // --------------------------------------------------
    // Speech started
    // --------------------------------------------------

    instance.onspeechstart = () => {
      console.log("[SPEECH] Speech started");

      clearTimeout(silenceTimeoutRef.current);
    };

    // --------------------------------------------------
    // Speech ended
    // --------------------------------------------------

    instance.onspeechend = () => {
      console.log(
        "[SPEECH] Speech ended. Starting silence timer..."
      );

      clearTimeout(silenceTimeoutRef.current);

      silenceTimeoutRef.current = setTimeout(() => {
        if (
          shouldBeRecordingRef.current &&
          recognitionRunningRef.current
        ) {
          console.log(
            "[SPEECH] Silence timeout reached. Stopping..."
          );

          shouldBeRecordingRef.current = false;
          manuallyStoppedRef.current = true;

          try {
            instance.stop();
          } catch (err) {
            console.warn(
              "[SPEECH] Stop after silence failed:",
              err
            );
          }
        }
      }, maxSilenceTimeout);
    };

    // --------------------------------------------------
    // Recognition results
    // --------------------------------------------------

    instance.onresult = (event) => {
      let currentInterimTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i];

        if (!result || !result[0]) {
          continue;
        }

        const transcriptText =
          result[0].transcript;

        // -------------------------------
        // FINAL result
        // -------------------------------

        if (result.isFinal) {
          const cleanText = transcriptText.trim();

          if (!cleanText) {
            continue;
          }

          const previousTranscript =
            finalTranscriptRef.current.trim();

          const updatedTranscript = previousTranscript
            ? `${previousTranscript} ${cleanText}`
            : cleanText;

          finalTranscriptRef.current =
            updatedTranscript;

          setTranscript(updatedTranscript);

          setInterimTranscript("");

          const words = cleanText
            .split(/\s+/)
            .filter(Boolean);

          setWordCount((prev) => prev + words.length);

          setConfidence(
            result[0].confidence || 0
          );

          // Prevent exact duplicate final chunks.
          if (
            lastFinalTranscriptRef.current !==
            updatedTranscript
          ) {
            lastFinalTranscriptRef.current =
              updatedTranscript;

            console.log(
              "[SPEECH] Final transcript:",
              updatedTranscript
            );

            callbacksRef.current.onFinalTranscript?.(
              updatedTranscript,
              {
                wordCount: words.length,
                confidence:
                  result[0].confidence || 0,
                timestamp: Date.now(),
              }
            );
          }

          continue;
        }

        // -------------------------------
        // INTERIM result
        // -------------------------------

        currentInterimTranscript +=
          transcriptText;
      }

      setInterimTranscript(
        currentInterimTranscript
      );

      const fullTranscript =
        `${finalTranscriptRef.current} ${currentInterimTranscript}`
          .trim();

      callbacksRef.current.onTranscriptUpdate?.(
        fullTranscript,
        {
          isFinal: false,
        }
      );
    };

    // --------------------------------------------------
    // Recognition error
    // --------------------------------------------------

    instance.onerror = (event) => {
      console.warn(
        "[SPEECH] Recognition error:",
        event.error
      );

      // These are common browser-level events and don't
      // necessarily mean the microphone is broken.
      if (
        event.error === "no-speech" ||
        event.error === "aborted"
      ) {
        return;
      }

      setError(
        `Speech recognition error: ${event.error}`
      );

      callbacksRef.current.onError?.(
        event.error
      );

      // Microphone/audio failure means we cannot
      // reliably continue.
      if (
        event.error === "audio-capture" ||
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        shouldBeRecordingRef.current = false;
        manuallyStoppedRef.current = true;

        setIsListening(false);
        setIsRecording(false);
        setIsPaused(false);
      }
    };

    // --------------------------------------------------
    // Cleanup
    // --------------------------------------------------

    return () => {
      console.log(
        "[SPEECH] Destroying recognition instance"
      );

      shouldBeRecordingRef.current = false;
      manuallyStoppedRef.current = true;

      clearTimeout(autoSaveRef.current);
      clearTimeout(silenceTimeoutRef.current);

      try {
        instance.stop();
      } catch (err) {
        // Ignore "not started" browser error.
      }

      instance.onstart = null;
      instance.onend = null;
      instance.onresult = null;
      instance.onerror = null;
      instance.onspeechstart = null;
      instance.onspeechend = null;

      if (recognitionRef.current === instance) {
        recognitionRef.current = null;
      }
    };
  }, [
    continuous,
    interimResults,
    language,
    maxSilenceTimeout,
  ]);

  // --------------------------------------------------
  // Auto-save
  // --------------------------------------------------

  useEffect(() => {
    if (
      autoSaveInterval <= 0 ||
      !transcript ||
      !isRecording ||
      isPaused
    ) {
      return;
    }

    clearTimeout(autoSaveRef.current);

    autoSaveRef.current = setTimeout(() => {
      if (
        callbacksRef.current.onAutoSave &&
        transcript.trim()
      ) {
        callbacksRef.current.onAutoSave({
          transcript,
          interimTranscript,
          isFinal: true,
          wordCount,
          confidence,
          startTime,
          elapsedTime,
        });
      }
    }, autoSaveInterval);

    return () => {
      clearTimeout(autoSaveRef.current);
    };
  }, [
    autoSaveInterval,
    transcript,
    interimTranscript,
    isRecording,
    isPaused,
    wordCount,
    confidence,
    startTime,
    elapsedTime,
  ]);

  // --------------------------------------------------
  // Elapsed timer
  // --------------------------------------------------

  useEffect(() => {
    let interval = null;

    if (
      isRecording &&
      startTime &&
      !isPaused
    ) {
      interval = setInterval(() => {
        setElapsedTime(
          Date.now() - startTime
        );
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    isRecording,
    startTime,
    isPaused,
  ]);

  // --------------------------------------------------
  // START
  // --------------------------------------------------

  const start = useCallback(() => {
    const instance = recognitionRef.current;

    if (!instance || !isSupported) {
      console.warn(
        "[SPEECH] Recognition is not available."
      );
      return;
    }

    // Already running → don't call start() again.
    if (recognitionRunningRef.current) {
      console.warn(
        "[SPEECH] Recognition is already running."
      );
      return;
    }

    console.log("[SPEECH] Starting recognition...");

    // Reset recording state.
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    setWordCount(0);
    setConfidence(0);
    setElapsedTime(0);
    setStartTime(null);
    setEndTime(null);

    finalTranscriptRef.current = "";
    transcriptHistoryRef.current = [];
    lastFinalTranscriptRef.current = "";

    shouldBeRecordingRef.current = true;
    manuallyStoppedRef.current = false;

    clearTimeout(silenceTimeoutRef.current);

    try {
      instance.start();
    } catch (err) {
      console.error(
        "[SPEECH] Failed to start:",
        err
      );

      shouldBeRecordingRef.current = false;

      setIsListening(false);
      setIsRecording(false);

      setError(
        "Could not start microphone. Please try again."
      );
    }
  }, [isSupported]);

  // --------------------------------------------------
  // STOP
  // --------------------------------------------------

  const stop = useCallback(() => {
    const instance = recognitionRef.current;

    if (!instance) {
      return;
    }

    console.log("[SPEECH] Manual stop");

    shouldBeRecordingRef.current = false;
    manuallyStoppedRef.current = true;

    clearTimeout(silenceTimeoutRef.current);

    if (recognitionRunningRef.current) {
      try {
        instance.stop();
      } catch (err) {
        console.warn(
          "[SPEECH] Stop failed:",
          err
        );
      }
    } else {
      setIsListening(false);
      setIsRecording(false);
      setIsPaused(false);
    }
  }, []);

  // --------------------------------------------------
  // PAUSE
  // --------------------------------------------------

  const pause = useCallback(() => {
    if (!recognitionRunningRef.current) {
      return;
    }

    console.log("[SPEECH] Pausing recognition");

    setIsPaused(true);

    // Keep recording session alive logically.
    // Browser SpeechRecognition has no reliable pause()
    // API, so we stop recognition and restart on resume.
    manuallyStoppedRef.current = true;

    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.warn(
        "[SPEECH] Pause stop failed:",
        err
      );
    }
  }, []);

  // --------------------------------------------------
  // RESUME
  // --------------------------------------------------

  const resume = useCallback(() => {
    const instance = recognitionRef.current;

    if (!instance || !isSupported) {
      return;
    }

    console.log("[SPEECH] Resuming recognition");

    setIsPaused(false);

    shouldBeRecordingRef.current = true;
    manuallyStoppedRef.current = false;

    setError(null);

    if (!recognitionRunningRef.current) {
      try {
        instance.start();
      } catch (err) {
        console.warn(
          "[SPEECH] Resume failed:",
          err
        );
      }
    }
  }, [isSupported]);

  // --------------------------------------------------
  // CLEAR / RESET
  // --------------------------------------------------

  const clear = useCallback(() => {
    console.log("[SPEECH] Clearing recording");

    const instance = recognitionRef.current;

    shouldBeRecordingRef.current = false;
    manuallyStoppedRef.current = true;

    clearTimeout(autoSaveRef.current);
    clearTimeout(silenceTimeoutRef.current);

    if (
      instance &&
      recognitionRunningRef.current
    ) {
      try {
        instance.stop();
      } catch (err) {
        // Ignore browser stop errors.
      }
    }

    setTranscript("");
    setInterimTranscript("");

    setIsListening(false);
    setIsRecording(false);
    setIsPaused(false);

    setError(null);
    setWordCount(0);
    setConfidence(0);

    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0);

    finalTranscriptRef.current = "";
    transcriptHistoryRef.current = [];
    lastFinalTranscriptRef.current = "";

    recognitionRunningRef.current = false;
  }, []);

  // --------------------------------------------------
  // Return API
  // --------------------------------------------------

  return {
    // State
    isSupported,
    isListening,
    isRecording,
    isPaused,

    transcript,
    interimTranscript,

    error,
    confidence,
    wordCount,

    elapsedTime,
    startTime,
    endTime,

    // Controls
    start,
    stop,
    pause,
    resume,
    clear,

    // Helpers
    hasTranscript: !!transcript.trim(),

    isEmpty:
      !transcript.trim() &&
      !interimTranscript.trim(),

    isFinal:
      !!finalTranscriptRef.current,
  };
};

export default useSpeechRecognition;
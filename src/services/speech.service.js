// Speech Service - frontend service for communicating with the speech-to-text backend
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class SpeechService {
  /**
   * Send final transcript to backend for evaluation
   * @param {Object} transcriptData
   * @param {string} transcriptData.interviewId - Interview session ID
   * @param {string} transcriptData.questionId - Current question ID
   * @param {string} transcriptData.transcript - Final transcript text
   * @param {Array} transcriptData.alternatives - Browser speech recognition alternatives
   * @param {number} transcriptData.startTime - Recording start timestamp
   * @param {number} transcriptData.endTime - Recording end timestamp
   * @param {number} transcriptData.responseDuration - Response duration in ms
   * @param {number} transcriptData.wordCount - Number of words
   * @param {string} transcriptData.topic - Topic of the question
   * @param {string} transcriptData.difficulty - Difficulty level
   * @param {string} transcriptData.contextId - Interview context ID
   * @returns {Promise<Object>} Evaluation result
   */
  async submitTranscript(transcriptData) {
    console.log("[SPEECH SERVICE] Sending transcript:", transcriptData);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/speech/transcript`,
        transcriptData,
      );

      console.log(
        "[SPEECH SERVICE] FULL RESPONSE:",
        JSON.stringify(response.data, null, 2),
      );

      return response.data;
    } catch (error) {
      console.error(
        "[SPEECH SERVICE] Request failed:",
        error.response?.status,
        error.response?.data || error.message,
      );

      throw error;
    }
  }

  /**
   * Auto-save interim transcript
   * @param {Object} data
   * @returns {Promise<Object>} Save result
   */
  async autoSaveTranscript(data) {
    const response = await axios.post(`${API_BASE_URL}/speech/auto-save`, data);
    return response.data;
  }

  /**
   * Get saved transcripts for recovery
   * @param {string} interviewId
   * @returns {Promise<Array>} Saved transcripts
   */
  async getTranscripts(interviewId) {
    const response = await axios.get(
      `${API_BASE_URL}/speech/transcripts/${interviewId}`,
    );
    return response.data;
  }

  /**
   * Start a new interview session
   * @param {Object} config - Interview configuration
   * @returns {Promise<Object>} Interview session info
   */
  async startInterview(config) {
    const response = await axios.post(
      `${API_BASE_URL}/interview/start`,
      config,
    );
    return response.data;
  }

  /**
   * Get next question from AI interviewer
   * @param {string} contextId
   * @returns {Promise<Object>} Next question
   */
  async getNextQuestion(contextId) {
    const response = await axios.post(`${API_BASE_URL}/interview/question`, {
      contextId,
    });
    return response.data;
  }

  /**
   * Get interview session details
   * @param {string} interviewId
   * @returns {Promise<Object>} Interview session with messages
   */
  async getInterview(interviewId) {
    const response = await axios.get(
      `${API_BASE_URL}/interview/${interviewId}`,
    );
    return response.data;
  }

  /**
   * End interview and generate final report
   * @param {string} contextId
   * @returns {Promise<Object>} Final report
   */
  async endInterview(contextId) {
    const response = await axios.post(`${API_BASE_URL}/interview/end`, {
      contextId,
    });
    return response.data;
  }

  /**
   * Get remaining interview time
   * @param {string} interviewId
   * @returns {Promise<Object>} Remaining time
   */
  async getRemainingTime(interviewId) {
    const response = await axios.get(
      `${API_BASE_URL}/interview/${interviewId}/timer`,
    );
    return response.data;
  }

  /**
   * Save speech transcript (alias for backward compatibility)
   * @deprecated Use submitTranscript instead
   */
  async saveSpeechTranscript(data) {
    return this.submitTranscript(data);
  }
}

export default new SpeechService();

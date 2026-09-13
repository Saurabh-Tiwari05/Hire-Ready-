// Interviee TranscriptBox - displays live transcription of speech recognition
import React from 'react';

const TranscriptBox = ({
  transcript,
  interimTranscript,
  isFinal,
  isRecording,
  error,
}) => {
  // Format interim transcript differently
  const formattedInterim = interimTranscript || '';
  const placeholder = 'Speak your response here...';
  const displayText = transcript || formattedInterim || placeholder;
  const isInterim = !!interimTranscript && !isFinal;

  return (
    <div className="max-w-full mb-6">
      <div
        className={`flex-1 min-h-20 px-4 py-3 rounded-lg border border-gray-700 bg-gray-900 text-white text-xs font-mono tracking-tight leading-relaxed ${
          isInterim ? 'opacity-70 italic' : ''
        }`}
      >
        <span className="whitespace-pre-wrap text-sm">{displayText}</span>
      </div>

      <div className="pt-2 px-3 bg-gray-800 rounded-sm text-xs text-gray-400 italic">
        {isRecording
          ? 'Recording...'
          : !isRecording && error
          ? `Error: ${error}`
          : 'Recording completed. Transcript saved.'}
      </div>
    </div>
  );
};

export default TranscriptBox;
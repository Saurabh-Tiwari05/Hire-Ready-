// MicStatus Component - shows live microphone state
import React from 'react';

const MicStatus = ({
  isListening,
  isRecording,
  isPaused,
  isSupported,
  error,
}) => {
  // Determine current status state
  let statusText = 'Disconnected';
  let statusColor = 'bg-gray-400';
  let textColor = 'text-gray-400';

  if (!isSupported) {
    statusText = 'Not Supported';
    statusColor = 'bg-red-500';
    textColor = 'text-red-400';
  } else if (error) {
    statusText = 'Permission Denied';
    statusColor = 'bg-red-500';
    textColor = 'text-red-400';
  } else if (isPaused) {
    statusText = 'Paused';
    statusColor = 'bg-yellow-500';
    textColor = 'text-yellow-400';
  } else if (isListening || isRecording) {
    statusText = 'Listening...';
    statusColor = 'bg-green-500 animate-pulse';
    textColor = 'text-green-400';
  } else {
    statusText = 'Microphone Connected';
    statusColor = 'bg-blue-500';
    textColor = 'text-blue-400';
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900/60 backdrop-blur-md rounded-full border border-gray-800">
      <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></span>
      <span className={`text-xs font-medium ${textColor}`}>{statusText}</span>
    </div>
  );
};

export default MicStatus;
import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function CameraVoicePanel({ onTranscript, disabled }) {
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [interimText, setInterimText] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      startListening();
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera access and try again.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    stopListening();
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    if (!speechSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text + ' ';
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
      if (final) {
        const newTranscript = final.trim();
        setTranscript(newTranscript);
        setInterimText('');
        if (onTranscript) {
          onTranscript(newTranscript);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      console.error('Speech error:', event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      if (cameraOn && streamRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported, onTranscript, cameraOn]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Camera & Voice</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {cameraOn ? (listening ? '🔴 Listening — speak freely' : 'Camera on') : 'Turn on to speak'}
          </p>
        </div>
        <button
          onClick={cameraOn ? stopCamera : startCamera}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            cameraOn
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-sky-600 hover:bg-sky-700 text-white'
          } disabled:opacity-50`}
        >
          {cameraOn ? '⏹ Stop' : '▶ Start'}
        </button>
      </div>

      <div className="relative bg-gray-950 aspect-video mx-4 mt-4 rounded-xl overflow-hidden border border-gray-800">
        {cameraOn ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-xs text-center px-4">Click Start to activate camera and microphone together</p>
          </div>
        )}

        {cameraOn && (
          <div className={`absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${listening ? 'bg-rose-900/80 text-rose-300' : 'bg-gray-800/80 text-gray-400'}`}>
            <span className={listening ? 'recording-pulse' : ''}>●</span>
            {listening ? 'LIVE' : 'MIC OFF'}
          </div>
        )}
      </div>

      {cameraError && (
        <div className="mx-4 mt-3 p-3 bg-rose-900/30 border border-rose-800 rounded-lg">
          <p className="text-xs text-rose-300">{cameraError}</p>
        </div>
      )}

      {!speechSupported && (
        <div className="mx-4 mt-3 p-3 bg-amber-900/30 border border-amber-800 rounded-lg">
          <p className="text-xs text-amber-300">⚠️ Speech recognition not supported in this browser. Use Chrome for best experience.</p>
        </div>
      )}

      <div className="flex-1 mx-4 mt-4 mb-4 overflow-hidden flex flex-col">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Live Transcript</p>
        <div className="flex-1 bg-gray-950 border border-gray-800 rounded-xl p-3 overflow-y-auto min-h-[80px]">
          {transcript ? (
            <p className="text-sm text-gray-200 leading-relaxed">{transcript}</p>
          ) : null}
          {interimText ? (
            <p className="text-sm text-gray-400 italic leading-relaxed">{interimText}...</p>
          ) : null}
          {!transcript && !interimText && (
            <p className="text-xs text-gray-600 italic">
              {cameraOn ? 'Speak into your microphone...' : 'Start camera to begin speaking'}
            </p>
          )}
        </div>

        {transcript && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                if (onTranscript) onTranscript(transcript);
                setTranscript('');
              }}
              className="flex-1 text-xs bg-sky-700 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              ↗ Send to Chat
            </button>
            <button
              onClick={() => setTranscript('')}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 font-medium mb-1">Tips</p>
          <ul className="text-xs text-gray-500 space-y-0.5">
            <li>• Voice auto-activates with camera</li>
            <li>• Speak clearly in English or Hinglish</li>
            <li>• Final sentences auto-send to chat</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

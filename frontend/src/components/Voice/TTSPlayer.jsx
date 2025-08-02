import React, { useState, useRef } from 'react';
import { apiService } from '../../services/api';

const TTSPlayer = ({ text, autoPlay = false, language = 'it' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const playTTS = async () => {
    if (!text || text.trim() === '') return;

    try {
      setIsLoading(true);
      setError(null);

      // Request TTS synthesis from backend
      const response = await apiService.tts.synthesize(text, language);
      
      // Create audio blob URL
      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setError('Errore nella riproduzione audio');
        URL.revokeObjectURL(audioUrl);
      };

      await audioRef.current.play();

    } catch (error) {
      console.error('TTS Error:', error);
      setError('Errore nella sintesi vocale');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Auto-play on text change if enabled
  React.useEffect(() => {
    if (autoPlay && text && text.trim() !== '') {
      playTTS();
    }
  }, [text, autoPlay]);

  if (!text || text.trim() === '') {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <button
        onClick={isPlaying ? stopTTS : playTTS}
        disabled={isLoading}
        className={`inline-flex items-center p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
          isLoading
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : isPlaying
            ? 'bg-red-100 text-red-600 hover:bg-red-200 focus:ring-red-500'
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200 focus:ring-blue-500'
        }`}
      >
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H10a1 1 0 01-1-1v-4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5H9m3-4v4m3-4a4 4 0 01-3.464 3.996M13 8V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate" title={text}>
          {text}
        </p>
        {isPlaying && (
          <div className="mt-1">
            <div className="flex space-x-1">
              <div className="w-1 h-3 bg-blue-500 animate-pulse rounded-full"></div>
              <div className="w-1 h-3 bg-blue-500 animate-pulse rounded-full" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-3 bg-blue-500 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-3 bg-blue-500 animate-pulse rounded-full" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        {isLoading ? 'Caricamento...' : isPlaying ? 'In riproduzione' : '🔊'}
      </div>

      {error && (
        <div className="text-xs text-red-600" title={error}>
          ⚠️
        </div>
      )}
    </div>
  );
};

export default TTSPlayer;
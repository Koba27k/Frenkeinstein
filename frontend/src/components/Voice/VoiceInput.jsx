import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

const VoiceInput = ({ onTranscript, onError, language = 'it-IT' }) => {
  const { state, actions } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      actions.setVoiceSupported(true);
      
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        setTranscript(prev => prev + finalTranscript);
        setInterimTranscript(interimTranscript);

        if (finalTranscript && onTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (onError) {
          onError(event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      actions.setVoiceSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, onTranscript, onError, actions]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  if (!state.voiceSupported) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center text-gray-600">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
          <span className="text-sm">Riconoscimento vocale non supportato in questo browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🎤 Comando Vocale
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={startListening}
            disabled={isListening}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isListening
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {isListening ? 'In ascolto...' : 'Inizia'}
          </button>
          
          <button
            onClick={stopListening}
            disabled={!isListening}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              !isListening
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H10a1 1 0 01-1-1v-4z" />
            </svg>
            Stop
          </button>
          
          <button
            onClick={clearTranscript}
            disabled={!transcript && !interimTranscript}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      {isListening && (
        <div className="flex items-center text-blue-600 mb-4">
          <div className="flex space-x-1 mr-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span className="text-sm font-medium">Ascolto in corso...</span>
        </div>
      )}

      {/* Transcript Display */}
      <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
        <div className="text-sm text-gray-600 mb-2">Trascrizione:</div>
        
        {(transcript || interimTranscript) ? (
          <div className="text-gray-900">
            <span className="font-medium">{transcript}</span>
            {interimTranscript && (
              <span className="text-gray-500 italic">{interimTranscript}</span>
            )}
          </div>
        ) : (
          <div className="text-gray-400 italic">
            {isListening 
              ? 'Parla ora per registrare il tuo messaggio...'
              : 'Clicca "Inizia" per utilizzare il riconoscimento vocale'
        }
      </div>
    )}
  </div>

  {/* Voice Commands Help */}
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <details className="cursor-pointer">
      <summary className="text-sm font-medium text-blue-800 hover:text-blue-900">
        💡 Comandi vocali supportati
      </summary>
      <div className="mt-2 text-sm text-blue-700 space-y-1">
        <p>• "Voglio prenotare un taglio di capelli"</p>
        <p>• "Controllo disponibilità per domani"</p>
        <p>• "Cancella il mio appuntamento"</p>
        <p>• "Prenota per giovedì alle 15"</p>
      </div>
    </details>
  </div>
</div>

  );
};

export default VoiceInput;
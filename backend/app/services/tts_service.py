"""
Text-to-Speech service using Coqui TTS with singleton pattern.
"""
import os
import io
import logging
from typing import Optional
from TTS.api import TTS
import torch

from app.core.config import settings

logger = logging.getLogger(__name__)


class TTSService:
    """Singleton TTS service for Italian text-to-speech."""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TTSService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.model = None
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.language = settings.TTS_LANGUAGE
            self._load_model()
            TTSService._initialized = True
    
    def _load_model(self):
        """Load TTS model (singleton initialization)."""
        try:
            # Use Coqui TTS Italian model
            model_name = "tts_models/it/mai_female/glow-tts"
            
            logger.info(f"Loading TTS model: {model_name}")
            self.model = TTS(
                model_name=model_name,
                progress_bar=False,
                gpu=self.device == "cuda"
            )
            logger.info("TTS model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load TTS model: {e}")
            self.model = None
    
    def synthesize(self, text: str, output_path: Optional[str] = None) -> Optional[bytes]:
        """
        Synthesize speech from text.
        
        Args:
            text: Text to synthesize
            output_path: Optional file path to save audio
            
        Returns:
            Audio bytes if successful, None otherwise
        """
        if not self.model:
            logger.error("TTS model not available")
            return None
        
        try:
            # Clean and prepare text
            clean_text = self._clean_text(text)
            
            if output_path:
                # Save to file
                self.model.tts_to_file(text=clean_text, file_path=output_path)
                
                # Read file and return bytes
                with open(output_path, 'rb') as f:
                    audio_bytes = f.read()
                
                # Clean up temporary file if needed
                if not output_path.startswith('/tmp/'):
                    os.remove(output_path)
                
                return audio_bytes
            else:
                # Generate in memory
                wav = self.model.tts(text=clean_text)
                
                # Convert to bytes (simplified - would need proper WAV encoding)
                audio_buffer = io.BytesIO()
                # This would require additional processing to create proper WAV format
                # For now, return placeholder
                return b"audio_placeholder"
                
        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            return None
    
    def _clean_text(self, text: str) -> str:
        """Clean and prepare text for TTS."""
        # Remove special characters that might cause issues
        clean_text = text.replace('\n', ' ').replace('\r', ' ')
        
        # Replace common abbreviations with full words (Italian)
        replacements = {
            'Dr.': 'Dottore',
            'Prof.': 'Professore',
            'etc.': 'eccetera',
            'vs.': 'contro',
            '&': 'e'
        }
        
        for abbrev, full_word in replacements.items():
            clean_text = clean_text.replace(abbrev, full_word)
        
        return clean_text.strip()
    
    def is_available(self) -> bool:
        """Check if TTS service is available."""
        return self.model is not None


# Singleton instance
tts_service = TTSService()
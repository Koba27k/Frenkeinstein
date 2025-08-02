"""
NLP service for processing natural language booking requests using Rasa.
"""
import requests
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import re

from app.core.config import settings

logger = logging.getLogger(__name__)


class NLPService:
    """Service for natural language processing of booking requests."""
    
    def __init__(self):
        self.rasa_url = settings.RASA_SERVER_URL
        
    async def process_message(self, message: str, sender_id: str = "user") -> Dict[str, Any]:
        """Process a natural language message through Rasa."""
        try:
            payload = {
                "sender": sender_id,
                "message": message
            }
            
            response = requests.post(
                f"{self.rasa_url}/webhooks/rest/webhook",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Rasa API error: {response.status_code}")
                return self._fallback_response(message)
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Rasa: {e}")
            return self._fallback_response(message)
    
    def _fallback_response(self, message: str) -> Dict[str, Any]:
        """Fallback response when Rasa is unavailable."""
        # Simple regex-based extraction for basic functionality
        booking_info = self._extract_booking_info(message)
        
        if booking_info:
            return [{
                "text": f"Ho capito che vuoi prenotare per {booking_info.get('service', 'un servizio')}. "
                       f"Potresti confermare la data e l'ora?",
                "intent": {"name": "book_appointment", "confidence": 0.7},
                "entities": booking_info
            }]
        else:
            return [{
                "text": "Scusa, non ho capito bene. Puoi ripetere la tua richiesta di prenotazione?",
                "intent": {"name": "fallback", "confidence": 1.0}
            }]
    
    def _extract_booking_info(self, message: str) -> Dict[str, Any]:
        """Extract basic booking information using regex patterns."""
        info = {}
        message_lower = message.lower()
        
        # Service type detection
        services = {
            "taglio": "haircut",
            "capelli": "haircut", 
            "barba": "beard_trim",
            "rasatura": "shave",
            "lavaggio": "wash_and_cut",
            "styling": "styling"
        }
        
        for keyword, service in services.items():
            if keyword in message_lower:
                info["service"] = service
                break
        
        # Date extraction (basic patterns)
        date_patterns = [
            r"(oggi|stasera)",
            r"(domani)",
            r"(\d{1,2})/(\d{1,2})",
            r"(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)"
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, message_lower)
            if match:
                info["date_mention"] = match.group(0)
                break
        
        # Time extraction
        time_pattern = r"(\d{1,2}):?(\d{2})?|(\d{1,2})\s*(del\s+)?(mattino|pomeriggio|sera)"
        time_match = re.search(time_pattern, message_lower)
        if time_match:
            info["time_mention"] = time_match.group(0)
        
        return info


# Singleton instance
nlp_service = NLPService()
"""
WhatsApp service for handling incoming messages and responses.
"""
from twilio.rest import Client
from typing import Dict, Any, Optional
import logging

from app.core.config import settings
from app.services.nlp_service import nlp_service
from app.services.reminder_service import reminder_service

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Service for handling WhatsApp interactions."""
    
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.whatsapp_from = settings.TWILIO_WHATSAPP_FROM
    
    async def process_incoming_message(
        self, 
        from_number: str, 
        message_body: str
    ) -> Dict[str, Any]:
        """Process incoming WhatsApp message."""
        try:
            # Extract sender ID for context
            sender_id = self._extract_sender_id(from_number)
            
            # Process message through NLP service
            nlp_response = await nlp_service.process_message(message_body, sender_id)
            
            # Generate appropriate response
            response = await self._generate_response(nlp_response, from_number)
            
            # Send response via WhatsApp
            if response.get('should_reply', True):
                await self._send_message(from_number, response['message'])
            
            return {
                'status': 'success',
                'processed': True,
                'intent': response.get('intent'),
                'response_sent': response.get('should_reply', True)
            }
            
        except Exception as e:
            logger.error(f"Error processing WhatsApp message: {e}")
            await self._send_error_message(from_number)
            return {'status': 'error', 'error': str(e)}
    
    async def _generate_response(
        self, 
        nlp_response: list, 
        from_number: str
    ) -> Dict[str, Any]:
        """Generate appropriate response based on NLP analysis."""
        if not nlp_response:
            return {
                'message': "Scusa, non ho capito. Puoi ripetere?",
                'should_reply': True,
                'intent': 'fallback'
            }
        
        first_response = nlp_response[0]
        intent = first_response.get('intent', {}).get('name', 'unknown')
        
        # Handle different intents
        if intent == 'book_appointment':
            return await self._handle_booking_intent(first_response, from_number)
        elif intent == 'check_availability':
            return await self._handle_availability_intent(first_response)
        elif intent == 'cancel_appointment':
            return await self._handle_cancellation_intent(from_number)
        elif intent == 'greet':
            return {
                'message': "Ciao! Sono l'assistente virtuale del barbiere. "
                          "Posso aiutarti a prenotare un appuntamento. "
                          "Dimmi che servizio ti serve e quando vorresti venire.",
                'should_reply': True,
                'intent': intent
            }
        else:
            return {
                'message': first_response.get('text', 
                    "Non sono sicuro di aver capito. Puoi aiutarmi con la prenotazione?"),
                'should_reply': True,
                'intent': intent
            }
    
    async def _handle_booking_intent(
        self, 
        response: Dict[str, Any], 
        from_number: str
    ) -> Dict[str, Any]:
        """Handle appointment booking intent."""
        entities = response.get('entities', {})
        
        # Check if we have enough information to proceed
        missing_info = []
        if not entities.get('service'):
            missing_info.append('il tipo di servizio')
        if not entities.get('date_mention') and not entities.get('time_mention'):
            missing_info.append('data e ora')
        
        if missing_info:
            message = f"Per prenotare ho bisogno di alcune informazioni: {', '.join(missing_info)}. "
            message += "Puoi fornirmele?"
        else:
            message = "Perfetto! Sto controllando la disponibilità per la tua prenotazione. "
            message += "Ti invierò a breve le opzioni disponibili."
            # Here you would integrate with the appointment booking logic
        
        return {
            'message': message,
            'should_reply': True,
            'intent': 'book_appointment',
            'entities': entities
        }
    
    async def _handle_availability_intent(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Handle availability check intent."""
        # This would integrate with calendar service
        message = "Controllo la disponibilità... Un momento per favore."
        
        return {
            'message': message,
            'should_reply': True,
            'intent': 'check_availability'
        }
    
    async def _handle_cancellation_intent(self, from_number: str) -> Dict[str, Any]:
        """Handle appointment cancellation intent."""
        message = ("Per cancellare un appuntamento, ho bisogno del tuo nome "
                  "o del numero di prenotazione. Puoi fornirmelo?")
        
        return {
            'message': message,
            'should_reply': True,
            'intent': 'cancel_appointment'
        }
    
    async def _send_message(self, to_number: str, message: str) -> bool:
        """Send WhatsApp message."""
        try:
            message_obj = self.client.messages.create(
                body=message,
                from_=self.whatsapp_from,
                to=to_number
            )
            
            logger.info(f"Message sent successfully. SID: {message_obj.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return False
    
    async def _send_error_message(self, to_number: str):
        """Send error message to user."""
        error_message = ("Mi dispiace, si è verificato un errore. "
                        "Riprova tra qualche minuto o contatta direttamente il barbiere.")
        await self._send_message(to_number, error_message)
    
    def _extract_sender_id(self, from_number: str) -> str:
        """Extract sender ID from WhatsApp number."""
        # Remove 'whatsapp:+' prefix and use last 10 digits as ID
        clean_number = from_number.replace('whatsapp:+', '')
        return clean_number[-10:] if len(clean_number) >= 10 else clean_number


# Singleton instance
whatsapp_service = WhatsAppService()
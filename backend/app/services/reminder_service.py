"""
Reminder service for sending WhatsApp notifications via Twilio.
"""
from twilio.rest import Client
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from app.core.config import settings
from app.models.appointment import Appointment

logger = logging.getLogger(__name__)


class ReminderService:
    """Service for sending appointment reminders via WhatsApp."""
    
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.whatsapp_from = settings.TWILIO_WHATSAPP_FROM
    
    async def send_appointment_reminder(
        self, 
        appointment: Appointment,
        custom_message: Optional[str] = None
    ) -> bool:
        """Send WhatsApp reminder for a specific appointment."""
        try:
            message_body = custom_message or self._create_reminder_message(appointment)
            
            # Format phone number for WhatsApp
            to_number = self._format_whatsapp_number(appointment.customer_phone)
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.whatsapp_from,
                to=to_number
            )
            
            logger.info(f"Reminder sent successfully. SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send reminder: {e}")
            return False
    
    def _create_reminder_message(self, appointment: Appointment) -> str:
        """Create reminder message content in Italian."""
        service_names = {
            'haircut': 'taglio di capelli',
            'beard_trim': 'sistemazione barba',
            'shave': 'rasatura',
            'wash_and_cut': 'lavaggio e taglio',
            'styling': 'styling'
        }
        
        service_name = service_names.get(appointment.service_type.value, 'servizio')
        appointment_time = appointment.appointment_datetime.strftime("%d/%m/%Y alle %H:%M")
        
        message = f"""🪒 Promemoria Appuntamento - Barbiere

Ciao {appointment.customer_name}!

Ti ricordiamo il tuo appuntamento per {service_name} 
📅 {appointment_time}

Se hai bisogno di modificare l'appuntamento, contattaci il prima possibile.

Grazie e a presto! ✂️"""
        
        return message
    
    def _format_whatsapp_number(self, phone: str) -> str:
        """Format phone number for WhatsApp API."""
        # Remove any non-digit characters
        digits_only = ''.join(filter(str.isdigit, phone))
        
        # Add country code if not present (assuming Italy +39)
        if not digits_only.startswith('39') and len(digits_only) == 10:
            digits_only = '39' + digits_only
        
        return f"whatsapp:+{digits_only}"
    
    async def send_confirmation_message(self, appointment: Appointment) -> bool:
        """Send booking confirmation via WhatsApp."""
        try:
            message_body = self._create_confirmation_message(appointment)
            to_number = self._format_whatsapp_number(appointment.customer_phone)
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.whatsapp_from,
                to=to_number
            )
            
            logger.info(f"Confirmation sent successfully. SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send confirmation: {e}")
            return False
    
    def _create_confirmation_message(self, appointment: Appointment) -> str:
        """Create booking confirmation message."""
        service_names = {
            'haircut': 'taglio di capelli',
            'beard_trim': 'sistemazione barba', 
            'shave': 'rasatura',
            'wash_and_cut': 'lavaggio e taglio',
            'styling': 'styling'
        }
        
        service_name = service_names.get(appointment.service_type.value, 'servizio')
        appointment_time = appointment.appointment_datetime.strftime("%d/%m/%Y alle %H:%M")
        
        message = f"""✅ Prenotazione Confermata!

Ciao {appointment.customer_name},

La tua prenotazione è stata confermata:
🪒 Servizio: {service_name}
📅 Data: {appointment_time}
💰 Prezzo: €{appointment.service_price}

Ti invieremo un promemoria 24 ore prima dell'appuntamento.

Grazie per aver scelto il nostro barbiere! ✂️"""
        
        if appointment.requires_prepayment:
            message += "\n\n💳 È richiesto il pagamento anticipato. Riceverai il link per il pagamento a breve."
        
        return message


# Singleton instance
reminder_service = ReminderService()
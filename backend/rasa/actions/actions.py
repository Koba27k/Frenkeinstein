"""Rasa custom actions for appointment booking"""
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.forms import FormAction
import requests
import logging

logger = logging.getLogger(__name__)

BACKEND_API_URL = "http://localhost:8000"


class ActionBookAppointment(Action):
    """Action to book an appointment."""

    def name(self) -> Text:
        return "action_book_appointment"

    def run(
        self, 
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        
        # Extract slot values
        service_type = tracker.get_slot("service_type")
        appointment_date = tracker.get_slot("appointment_date")
        appointment_time = tracker.get_slot("appointment_time")
        customer_name = tracker.get_slot("customer_name")
        customer_phone = tracker.get_slot("customer_phone")

        # Validate required information
        if not all([service_type, appointment_date, appointment_time, customer_name, customer_phone]):
            dispatcher.utter_message(text="Mi servono tutte le informazioni per procedere con la prenotazione.")
            return []

        try:
            # Call backend API to create appointment
            appointment_data = {
                "customer_name": customer_name,
                "customer_phone": customer_phone,
                "appointment_datetime": f"{appointment_date}T{appointment_time# Metis Connect - Virtual Barbershop Secretary

## 2. Configuration Files

### .env.template
```env
# Database
DATABASE_URL=postgresql://metis:password@localhost:5432/metis_connect
DATABASE_URL_TEST=sqlite:///./test.db

# Security
SECRET_KEY=your-super-secret-jwt-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# TTS
TTS_MODEL_PATH=./models/tts/italian_model.pth
TTS_LANGUAGE=it

# Calendar
CALDAV_URL=https://calendar.example.com/dav/
CALDAV_USERNAME=your-calendar-username
CALDAV_PASSWORD=your-calendar-password

# Rasa
RASA_SERVER_URL=http://localhost:5005

# Environment
ENVIRONMENT=development
DEBUG=true
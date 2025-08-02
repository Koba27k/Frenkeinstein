"""
Payment service for Stripe integration.
"""
import stripe
from typing import Dict, Any, Optional
import logging

from app.core.config import settings
from app.models.appointment import Appointment
from app.models.payment import Payment, PaymentStatus

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentService:
    """Service for handling payments via Stripe."""
    
    def __init__(self):
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    async def create_payment_session(
        self, 
        appointment: Appointment,
        success_url: str,
        cancel_url: str
    ) -> Optional[Dict[str, Any]]:
        """Create Stripe checkout session for appointment payment."""
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f'Appuntamento Barbiere - {appointment.service_type.value}',
                            'description': f'Prenotazione per {appointment.customer_name}',
                        },
                        'unit_amount': int(appointment.service_price * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=appointment.customer_email,
                metadata={
                    'appointment_id': str(appointment.id),
                    'customer_phone': appointment.customer_phone
                }
            )
            
            return {
                'session_id': session.id,
                'checkout_url': session.url,
                'payment_intent_id': session.payment_intent
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating session: {e}")
            return None
        except Exception as e:
            logger.error(f"Error creating payment session: {e}")
            return None
    
    async def create_payment_intent(
        self, 
        amount: float, 
        currency: str = 'eur',
        appointment_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Create Stripe payment intent for direct payment."""
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
                metadata={
                    'appointment_id': str(appointment_id) if appointment_id else ''
                }
            )
            
            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            return None
    
    def handle_webhook(self, payload: str, signature: str) -> Optional[Dict[str, Any]]:
        """Handle Stripe webhook events."""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            
            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']
                return self._handle_successful_payment(session)
            
            elif event['type'] == 'payment_intent.succeeded':
                payment_intent = event['data']['object']
                return self._handle_payment_intent_success(payment_intent)
            
            elif event['type'] == 'payment_intent.payment_failed':
                payment_intent = event['data']['object']
                return self._handle_payment_failure(payment_intent)
            
            return {'status': 'unhandled_event', 'type': event['type']}
            
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            return None
    
    def _handle_successful_payment(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful checkout session."""
        appointment_id = session.get('metadata', {}).get('appointment_id')
        
        return {
            'status': 'payment_success',
            'appointment_id': appointment_id,
            'session_id': session.get('id'),
            'payment_intent_id': session.get('payment_intent')
        }
    
    def _handle_payment_intent_success(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful payment intent."""
        appointment_id = payment_intent.get('metadata', {}).get('appointment_id')
        
        return {
            'status': 'payment_intent_success',
            'appointment_id': appointment_id,
            'payment_intent_id': payment_intent.get('id'),
            'amount': payment_intent.get('amount')
        }
    
    def _handle_payment_failure(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """Handle failed payment."""
        appointment_id = payment_intent.get('metadata', {}).get('appointment_id')
        
        return {
            'status': 'payment_failed', 
            'appointment_id': appointment_id,
            'payment_intent_id': payment_intent.get('id'),
            'error': payment_intent.get('last_payment_error')
        }
    
    async def refund_payment(self, payment_intent_id: str, amount: Optional[float] = None) -> bool:
        """Refund a payment."""
        try:
            refund_data = {'payment_intent': payment_intent_id}
            if amount:
                refund_data['amount'] = int(amount * 100)
            
            refund = stripe.Refund.create(**refund_data)
            
            return refund.status == 'succeeded'
            
        except stripe.error.StripeError as e:
            logger.error(f"Refund failed: {e}")
            return False


# Singleton instance
payment_service = PaymentService()
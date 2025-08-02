"""
Payment routes for Stripe integration.
"""
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional
import logging

from app.services.payment_service import payment_service

router = APIRouter()
logger = logging.getLogger(__name__)


class PaymentIntentRequest(BaseModel):
    amount: float
    currency: str = "eur"
    appointment_id: Optional[int] = None


@router.post("/create-intent")
async def create_payment_intent(request: PaymentIntentRequest):
    """Create Stripe payment intent."""
    try:
        intent_data = await payment_service.create_payment_intent(
            request.amount,
            request.currency,
            request.appointment_id
        )
        
        if not intent_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payment intent"
            )
        
        return intent_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment error: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    try:
        payload = await request.body()
        signature = request.headers.get('stripe-signature')
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe signature"
            )
        
        result = payment_service.handle_webhook(payload.decode(), signature)
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook data"
            )
        
        # Handle successful payment
        if result.get('status') == 'payment_success':
            # Update appointment status, send confirmation, etc.
            logger.info(f"Payment successful for appointment {result.get('appointment_id')}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )
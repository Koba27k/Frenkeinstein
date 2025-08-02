"""
Appointment routes for booking and management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import verify_token
from app.models.appointment import Appointment, AppointmentStatus, ServiceType
from app.services.calendar_service import calendar_service
from app.services.reminder_service import reminder_service
from app.services.payment_service import payment_service

router = APIRouter()


# Pydantic models for request/response
class AppointmentCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    customer_email: Optional[str] = None
    appointment_datetime: datetime
    service_type: ServiceType
    service_duration: int = Field(default=30, ge=15, le=120)
    service_price: float = Field(..., ge=0)
    notes: Optional[str] = None
    requires_prepayment: bool = False


class AppointmentResponse(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    appointment_datetime: datetime
    service_type: ServiceType
    service_duration: int
    service_price: float
    status: AppointmentStatus
    notes: Optional[str]
    requires_prepayment: bool
    payment_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AvailabilityRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    duration_minutes: int = 30


@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new appointment."""
    try:
        # Check if slot is available
        slots = await calendar_service.get_available_slots(
            appointment_data.appointment_datetime,
            appointment_data.appointment_datetime + timedelta(minutes=appointment_data.service_duration),
            appointment_data.service_duration
        )
        
        available_slot = next(
            (slot for slot in slots 
             if slot['start_time'] <= appointment_data.appointment_datetime < slot['end_time'] 
             and slot['available']), 
            None
        )
        
        if not available_slot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected time slot is not available"
            )
        
        # Create appointment
        appointment = Appointment(**appointment_data.dict())
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        
        # Send confirmation
        await reminder_service.send_confirmation_message(appointment)
        
        # Create calendar event
        await calendar_service.create_appointment({
            'id': appointment.id,
            'title': f"Appuntamento - {appointment.customer_name}",
            'start_time': appointment.appointment_datetime,
            'duration': appointment.service_duration,
            'description': f"Servizio: {appointment.service_type.value}\nCliente: {appointment.customer_name}\nTelefono: {appointment.customer_phone}"
        })
        
        return appointment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create appointment: {str(e)}"
        )


@router.get("/availability")
async def get_availability(
    availability_request: AvailabilityRequest = Depends()
):
    """Get available appointment slots."""
    try:
        slots = await calendar_service.get_available_slots(
            availability_request.start_date,
            availability_request.end_date,
            availability_request.duration_minutes
        )
        
        # Filter only available slots
        available_slots = [slot for slot in slots if slot['available']]
        
        return {
            'available_slots': available_slots,
            'total_slots': len(available_slots)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get availability: {str(e)}"
        )


@router.get("/", response_model=List[AppointmentResponse])
async def get_appointments(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[AppointmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Get appointments (protected endpoint)."""
    query = db.query(Appointment)
    
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    
    appointments = query.offset(skip).limit(limit).all()
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Get specific appointment by ID."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    return appointment


@router.put("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: int,
    new_status: AppointmentStatus,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Update appointment status (protected)."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment.status = new_status
    db.commit()
    
    return {"message": "Appointment status updated successfully"}


@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db)
):
    """Cancel an appointment."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Update status instead of deleting
    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    
    # Send cancellation notification
    try:
        from app.services.whatsapp_service import whatsapp_service
        cancellation_message = f"""❌ Appuntamento Cancellato

Ciao {appointment.customer_name},

Il tuo appuntamento del {appointment.appointment_datetime.strftime('%d/%m/%Y alle %H:%M')} è stato cancellato.

Se hai bisogno di prenotare nuovamente, contattaci!"""
        
        await whatsapp_service._send_message(
            whatsapp_service._format_whatsapp_number(appointment.customer_phone),
            cancellation_message
        )
    except Exception as e:
        # Log error but don't fail the cancellation
        pass
    
    return {"message": "Appointment cancelled successfully"}


@router.post("/{appointment_id}/payment")
async def create_appointment_payment(
    appointment_id: int,
    success_url: str,
    cancel_url: str,
    db: Session = Depends(get_db)
):
    """Create payment session for appointment."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if not appointment.requires_prepayment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This appointment does not require prepayment"
        )
    
    # Create Stripe checkout session
    session_data = await payment_service.create_payment_session(
        appointment, success_url, cancel_url
    )
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment session"
        )
    
    return {
        'checkout_url': session_data['checkout_url'],
        'session_id': session_data['session_id']
    }


### backend/app/routes/tts.py
```python
"""
Text-to-Speech routes for voice responses.
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
import tempfile
import os

from app.services.tts_service import tts_service

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    language: str = "it"


@router.post("/synthesize")
async def synthesize_speech(request: TTSRequest):
    """Synthesize speech from text."""
    if not tts_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TTS service is not available"
        )
    
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty"
        )
    
    try:
        # Create temporary file for audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
        
        # Synthesize speech
        audio_bytes = tts_service.synthesize(request.text, temp_path)
        
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to synthesize speech"
            )
        
        # Clean up temp file
        try:
            os.unlink(temp_path)
        except:
            pass
        
        # Return audio as streaming response
        audio_stream = io.BytesIO(audio_bytes)
        
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=speech.wav"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TTS error: {str(e)}"
        )


@router.get("/status")
async def get_tts_status():
    """Get TTS service status."""
    return {
        "available": tts_service.is_available(),
        "language": tts_service.language,
        "device": tts_service.device
    }
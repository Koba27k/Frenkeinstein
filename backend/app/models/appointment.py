"""
Appointment model for barbershop bookings.
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, Enum, Text, Boolean
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class AppointmentStatus(enum.Enum):
    """Appointment status enumeration."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ServiceType(enum.Enum):
    """Service type enumeration."""
    HAIRCUT = "haircut"
    BEARD_TRIM = "beard_trim"
    SHAVE = "shave"
    WASH_AND_CUT = "wash_and_cut"
    STYLING = "styling"


class Appointment(BaseModel):
    """Appointment model."""
    __tablename__ = "appointments"
    
    # Customer information
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    customer_email = Column(String(100), nullable=True)
    
    # Appointment details
    appointment_datetime = Column(DateTime(timezone=True), nullable=False)
    service_type = Column(Enum(ServiceType), nullable=False)
    service_duration = Column(Integer, default=30)  # minutes
    service_price = Column(Float, nullable=False)
    
    # Status and notes
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING)
    notes = Column(Text, nullable=True)
    
    # Payment
    requires_prepayment = Column(Boolean, default=False)
    payment_id = Column(String(100), nullable=True)
    
    # Reminders
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Appointment {self.id}: {self.customer_name} - {self.appointment_datetime}>"
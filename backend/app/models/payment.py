"""
Payment model for appointment payments.
"""
from sqlalchemy import Column, String, Float, Enum, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class PaymentStatus(enum.Enum):
    """Payment status enumeration."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(enum.Enum):
    """Payment method enumeration."""
    STRIPE = "stripe"
    PAYPAL = "paypal"
    CASH = "cash"


class Payment(BaseModel):
    """Payment model."""
    __tablename__ = "payments"
    
    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="EUR")
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # External payment references
    stripe_payment_intent_id = Column(String(100), nullable=True)
    stripe_session_id = Column(String(100), nullable=True)
    
    # Appointment relationship
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    appointment = relationship("Appointment", back_populates="payment")
    
    # Timestamps
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Payment {self.id}: {self.amount} {self.currency} - {self.status}>"
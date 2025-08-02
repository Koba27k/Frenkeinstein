"""
Calendar service for availability checking and appointment management.
"""
import caldav
from datetime import datetime, timedelta, time
from typing import List, Dict, Any, Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class CalendarService:
    """Service for calendar integration and availability management."""
    
    def __init__(self):
        self.caldav_url = settings.CALDAV_URL
        self.username = settings.CALDAV_USERNAME
        self.password = settings.CALDAV_PASSWORD
        self.client = None
        
        # Business hours configuration
        self.business_hours = {
            'monday': (time(9, 0), time(18, 0)),
            'tuesday': (time(9, 0), time(18, 0)),
            'wednesday': (time(9, 0), time(18, 0)),
            'thursday': (time(9, 0), time(18, 0)),
            'friday': (time(9, 0), time(18, 0)),
            'saturday': (time(9, 0), time(16, 0)),
            'sunday': None  # Closed
        }
        
        self.appointment_duration = 30  # minutes
        
    def _get_client(self):
        """Get CalDAV client instance."""
        if not self.client and self.caldav_url:
            try:
                self.client = caldav.DAVClient(
                    url=self.caldav_url,
                    username=self.username,
                    password=self.password
                )
            except Exception as e:
            logger.error(f"Failed to create calendar appointment: {e}")
            return False


# Singleton instance
calendar_service = CalendarService()
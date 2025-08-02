/**
 * Calendar view component for appointment visualization
 */
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import 'react-calendar/dist/Calendar.css';

const CalendarView = ({ onDateSelect, appointments = [] }) => {
  const { state, actions } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayAppointments, setDayAppointments] = useState([]);

  useEffect(() => {
    // Filter appointments for selected date
    const filteredAppointments = appointments.filter(apt => 
      isSameDay(parseISO(apt.appointment_datetime), selectedDate)
    );
    setDayAppointments(filteredAppointments);
  }, [selectedDate, appointments]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Custom tile content to show appointment indicators
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayAppointments = appointments.filter(apt => 
        isSameDay(parseISO(apt.appointment_datetime), date)
      );
      
      if (dayAppointments.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        );
      }
    }
    return null;
  };

  // Custom tile class name for styling
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const hasAppointments = appointments.some(apt => 
        isSameDay(parseISO(apt.appointment_datetime), date)
      );
      
      if (hasAppointments) {
        return 'has-appointments';
      }
    }
    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✅',
      'completed': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '📅';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📅 Calendario Appuntamenti
        </h2>
        <p className="text-gray-600">
          Visualizza e gestisci gli appuntamenti
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <style>{`
            .react-calendar {
              width: 100% !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 0.5rem !important;
              font-family: inherit !important;
            }
            .react-calendar__tile {
              position: relative !important;
              padding: 0.75rem 0.5rem !important;
              background: none !important;
              border: none !important;
              font-size: 0.875rem !important;
            }
            .react-calendar__tile:enabled:hover {
              background-color: #f3f4f6 !important;
            }
            .react-calendar__tile--active {
              background: #3b82f6 !important;
              color: white !important;
            }
            .react-calendar__tile.has-appointments {
              font-weight: 600 !important;
            }
            .react-calendar__navigation button {
              color: #374151 !important;
              font-size: 1rem !important;
              font-weight: 500 !important;
            }
            .react-calendar__navigation button:enabled:hover {
              background-color: #f3f4f6 !important;
            }
          `}</style>
          
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="it-IT"
            minDate={new Date()}
          />
        </div>

        {/* Day's Appointments */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Appuntamenti del {format(selectedDate, 'dd/MM/yyyy')}
          </h3>
          
          {dayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-500">Nessun appuntamento per questa data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAppointments
                .sort((a, b) => new Date(a.appointment_datetime) - new Date(b.appointment_datetime))
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`p-4 border rounded-lg ${getStatusColor(appointment.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">
                            {getStatusIcon(appointment.status)}
                          </span>
                          <h4 className="font-semibold">
                            {appointment.customer_name}
                          </h4>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">Orario:</span>{' '}
                            {format(parseISO(appointment.appointment_datetime), 'HH:mm')}
                          </p>
                          <p>
                            <span className="font-medium">Servizio:</span>{' '}
                            {appointment.service_type}
                          </p>
                          <p>
                            <span className="font-medium">Durata:</span>{' '}
                            {appointment.service_duration} min
                          </p>
                          <p>
                            <span className="font-medium">Prezzo:</span>{' '}
                            €{appointment.service_price}
                          </p>
                          {appointment.customer_phone && (
                            <p>
                              <span className="font-medium">Telefono:</span>{' '}
                              <a 
                                href={`tel:${appointment.customer_phone}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {appointment.customer_phone}
                              </a>
                            </p>
                          )}
                          {appointment.notes && (
                            <p>
                              <span className="font-medium">Note:</span>{' '}
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
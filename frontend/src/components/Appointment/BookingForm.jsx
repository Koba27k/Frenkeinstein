/**
 * Booking form component for appointment creation
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

const serviceTypes = [
  { value: 'haircut', label: 'Taglio di Capelli', price: 25, duration: 30 },
  { value: 'beard_trim', label: 'Sistemazione Barba', price: 15, duration: 20 },
  { value: 'shave', label: 'Rasatura', price: 20, duration: 25 },
  { value: 'wash_and_cut', label: 'Lavaggio e Taglio', price: 35, duration: 45 },
  { value: 'styling', label: 'Styling', price: 30, duration: 40 }
];

const BookingForm = ({ onSuccess }) => {
  const { state, actions } = useApp();
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm();

  const watchedService = watch('service_type');
  const watchedDate = watch('appointment_date');

  // Update selected service when form changes
  useEffect(() => {
    const service = serviceTypes.find(s => s.value === watchedService);
    setSelectedService(service);
  }, [watchedService]);

  // Fetch available slots when date or service changes
  useEffect(() => {
    if (watchedDate && selectedService) {
      fetchAvailableSlots();
    }
  }, [watchedDate, selectedService]);

  const fetchAvailableSlots = async () => {
    if (!watchedDate || !selectedService) return;

    try {
      actions.setLoading(true);
      const startDate = new Date(watchedDate + 'T09:00:00');
      const endDate = new Date(watchedDate + 'T18:00:00');

      const response = await apiService.appointments.getAvailability({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        duration_minutes: selectedService.duration
      });

      setAvailableSlots(response.data.available_slots || []);
    } catch (error) {
      actions.setError('Errore nel caricamento degli orari disponibili');
      console.error('Error fetching slots:', error);
    } finally {
      actions.setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      actions.setLoading(true);
      actions.clearError();

      const appointmentData = {
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        appointment_datetime: new Date(data.appointment_date + 'T' + data.appointment_time).toISOString(),
        service_type: data.service_type,
        service_duration: selectedService.duration,
        service_price: selectedService.price,
        notes: data.notes || null,
        requires_prepayment: data.requires_prepayment || false
      };

      const response = await apiService.appointments.create(appointmentData);
      
      actions.addAppointment(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }

    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Errore nella creazione dell\'appuntamento';
      actions.setError(errorMessage);
    } finally {
      actions.setLoading(false);
    }
  };

  // Generate time slots from available slots
  const timeSlots = availableSlots
    .filter(slot => slot.available)
    .map(slot => {
      const time = new Date(slot.start_time);
      return {
        value: format(time, 'HH:mm'),
        label: format(time, 'HH:mm'),
        datetime: slot.start_time
      };
    });

  // Get minimum date (tomorrow)
  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🪒 Prenota il tuo Appuntamento
        </h2>
        <p className="text-gray-600">
          Compila il modulo per prenotare il tuo servizio presso il nostro barbiere
        </p>
      </div>

      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p className="font-medium">Errore</p>
          <p>{state.error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              {...register('customer_name', { 
                required: 'Il nome è obbligatorio',
                minLength: { value: 2, message: 'Il nome deve essere di almeno 2 caratteri' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. Mario Rossi"
            />
            {errors.customer_name && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numero di Telefono *
            </label>
            <input
              type="tel"
              {...register('customer_phone', { 
                required: 'Il numero di telefono è obbligatorio',
                pattern: {
                  value: /^[\+]?[0-9\s\-\(\)]{10,}$/,
                  message: 'Inserisci un numero di telefono valido'
                }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. +39 123 456 7890"
            />
            {errors.customer_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (opzionale)
          </label>
          <input
            type="email"
            {...register('customer_email', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Inserisci un indirizzo email valido'
              }
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es. mario.rossi@email.com"
          />
          {errors.customer_email && (
            <p className="mt-1 text-sm text-red-600">{errors.customer_email.message}</p>
          )}
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo di Servizio *
          </label>
          <select
            {...register('service_type', { required: 'Seleziona un servizio' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleziona un servizio...</option>
            {serviceTypes.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label} - €{service.price} ({service.duration} min)
              </option>
            ))}
          </select>
          {errors.service_type && (
            <p className="mt-1 text-sm text-red-600">{errors.service_type.message}</p>
          )}
        </div>

        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Appuntamento *
            </label>
            <input
              type="date"
              min={minDate}
              {...register('appointment_date', { required: 'Seleziona una data' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.appointment_date && (
              <p className="mt-1 text-sm text-red-600">{errors.appointment_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Orario *
            </label>
            <select
              {...register('appointment_time', { required: 'Seleziona un orario' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!watchedDate || !selectedService || state.loading}
            >
              <option value="">
                {state.loading ? 'Caricamento...' : 'Seleziona un orario...'}
              </option>
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
            {errors.appointment_time && (
              <p className="mt-1 text-sm text-red-600">{errors.appointment_time.message}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note Aggiuntive
          </label>
          <textarea
            {...register('notes')}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Eventuali richieste speciali o note..."
          />
        </div>

        {/* Prepayment Option */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="requires_prepayment"
            {...register('requires_prepayment')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="requires_prepayment" className="ml-2 block text-sm text-gray-700">
            Richiedi pagamento anticipato
          </label>
        </div>

        {/* Service Summary */}
        {selectedService && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Riepilogo Servizio</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Servizio:</span> {selectedService.label}</p>
              <p><span className="font-medium">Durata:</span> {selectedService.duration} minuti</p>
              <p><span className="font-medium">Prezzo:</span> €{selectedService.price}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || state.loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || state.loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Prenotazione in corso...
            </span>
          ) : (
            '📅 Prenota Appuntamento'
          )}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
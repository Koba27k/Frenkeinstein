/**
 * Appointment confirmation component
 */
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

const Confirmation = ({ appointment, onPaymentRequired, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!appointment) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nessun appuntamento da confermare</p>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!appointment.requires_prepayment || !onPaymentRequired) return;
    
    setIsProcessing(true);
    try {
      await onPaymentRequired(appointment);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const serviceTypeLabels = {
    'haircut': 'Taglio di Capelli',
    'beard_trim': 'Sistemazione Barba',
    'shave': 'Rasatura',
    'wash_and_cut': 'Lavaggio e Taglio',
    'styling': 'Styling'
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ✅ Prenotazione Confermata!
        </h2>
        <p className="text-gray-600">
          Il tuo appuntamento è stato registrato con successo
        </p>
      </div>

      {/* Appointment Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Dettagli Appuntamento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Cliente</p>
            <p className="text-lg text-gray-900">{appointment.customer_name}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Telefono</p>
            <p className="text-lg text-gray-900">{appointment.customer_phone}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Data e Ora</p>
            <p className="text-lg text-gray-900">
              {format(parseISO(appointment.appointment_datetime), 'dd/MM/yyyy - HH:mm')}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Servizio</p>
            <p className="text-lg text-gray-900">
              {serviceTypeLabels[appointment.service_type] || appointment.service_type}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Durata</p>
            <p className="text-lg text-gray-900">{appointment.service_duration} minuti</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Prezzo</p>
            <p className="text-lg font-semibold text-gray-900">€{appointment.service_price}</p>
          </div>
        </div>

        {appointment.customer_email && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-lg text-gray-900">{appointment.customer_email}</p>
          </div>
        )}

        {appointment.notes && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Note</p>
            <p className="text-lg text-gray-900">{appointment.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Section */}
      {appointment.requires_prepayment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                💳 Pagamento Richiesto
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  È richiesto il pagamento anticipato di <strong>€{appointment.service_price}</strong> per confermare definitivamente l'appuntamento.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Elaborazione...
                    </>
                  ) : (
                    '💳 Procedi al Pagamento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Important Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              ℹ️ Informazioni Importanti
            </h3>
            <div className="mt-2 text-sm text-yellow-700 space-y-2">
              <p>• Ti invieremo un promemoria WhatsApp 24 ore prima dell'appuntamento</p>
              <p>• In caso di necessità di modifiche, contattaci il prima possibile</p>
              <p>• Presenta questo numero di prenotazione: <strong>#{appointment.id}</strong></p>
              {!appointment.requires_prepayment && (
                <p>• Il pagamento può essere effettuato direttamente in negozio</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.print()}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          🖨️ Stampa Conferma
        </button>
        
        {onComplete && (
          <button
            onClick={() => onComplete(appointment)}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            ✅ Completa
          </button>
        )}
      </div>

      {/* Contact Information */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Per qualsiasi domanda o modifica:
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="tel:+39123456789" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            📞 +39 123 456 789
          </a>
          <a 
            href="https://wa.me/39123456789" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-green-600 hover:text-green-800"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
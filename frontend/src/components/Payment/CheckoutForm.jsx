/**
 * Stripe checkout form component
 */
import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  LinkAuthenticationElement
} from '@stripe/react-stripe-js';
import { apiService } from '../../services/api';

const CheckoutForm = ({ appointment, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [email, setEmail] = useState(appointment?.customer_email || '');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // Create payment intent
      const paymentIntentResponse = await apiService.payments.createIntent(
        appointment.service_price,
        'eur',
        appointment.id
      );

      const { client_secret } = paymentIntentResponse.data;

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          payment_method_data: {
            billing_details: {
              name: appointment.customer_name,
              email: email,
              phone: appointment.customer_phone,
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        // Payment failed
        console.error('Payment error:', error);
        setMessage(error.message);
        
        if (onError) {
          onError(error);
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        setMessage('Pagamento completato con successo! 🎉');
        
        if (onSuccess) {
          onSuccess({
            paymentIntent,
            appointment
          });
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setMessage('Si è verificato un errore durante il pagamento.');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email for receipts */}
      <div>
        <LinkAuthenticationElement
          id="link-authentication-element"
          onChange={(event) => setEmail(event.value.email)}
          options={{
            defaultValues: {
              email: appointment?.customer_email || ''
            }
          }}
        />
      </div>

      {/* Payment Element */}
      <div>
        <PaymentElement 
          id="payment-element"
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: appointment?.customer_name || '',
                email: appointment?.customer_email || '',
                phone: appointment?.customer_phone || '',
              }
            }
          }}
        />
      </div>

      {/* Error/Success Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('successo') || message.includes('🎉')
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.includes('successo') || message.includes('🎉') ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Elaborazione pagamento...
          </span>
        ) : (
          `💳 Paga €${appointment?.service_price || '0'}`
        )}
      </button>

      {/* Payment Methods Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-2">Metodi di pagamento accettati</p>
        <div className="flex justify-center items-center space-x-3">
          <div className="text-xs bg-gray-100 px-2 py-1 rounded">💳 Carta</div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded">🏦 Bonifico</div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded">📱 Digitale</div>
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;
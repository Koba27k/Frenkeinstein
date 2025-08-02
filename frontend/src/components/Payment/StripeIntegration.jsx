/**
 * Stripe integration component
 */
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const StripeIntegration = ({ appointment, onSuccess, onError }) => {
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
    rules: {
      '.Tab': {
        padding: '10px 12px 8px 12px',
        border: '1px solid #e5e7eb',
      },
      '.Input': {
        padding: '10px 12px',
        border: '1px solid #d1d5db',
      },
      '.Input:focus': {
        border: '1px solid #3b82f6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)',
      },
    },
  };

  if (!appointment) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nessun appuntamento selezionato per il pagamento</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          💳 Pagamento Sicuro
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Appuntamento:</span>
              <span className="font-medium">#{appointment.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{appointment.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Servizio:</span>
              <span className="font-medium">{appointment.service_type}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Totale:</span>
              <span>€{appointment.service_price}</span>
            </div>
          </div>
        </div>
      </div>

      <Elements 
        stripe={stripePromise} 
        options={{ 
          appearance,
          locale: 'it'
        }}
      >
        <CheckoutForm 
          appointment={appointment}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>

      {/* Security Badges */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Sicuro</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>SSL</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-blue-600">stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeIntegration;
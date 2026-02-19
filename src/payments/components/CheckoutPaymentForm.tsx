'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePayCheckout } from '../hooks/usePayCheckout';
import { PaidBlocksOptions } from '../../utils/apiClient';

interface CheckoutSession {
  id: string;
  token: string;
  product: {
    name: string;
    description?: string | null;
  };
  customer: {
    email: string | null;
  };
  pricing?: {
    amount: number;
    currency: string;
    subtotal?: number;
    tax?: number;
  } | null;
}

interface CheckoutPaymentFormProps {
  session: CheckoutSession;
  stripePublishableKey: string;
  stripeAccount?: string;
  options?: PaidBlocksOptions;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PaymentFormProps {
  session: CheckoutSession;
  options?: PaidBlocksOptions;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ session, options, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();

  if (!session.pricing) {
    return null;
  }

  const pricing = session.pricing;

  const { state, payCheckout } = usePayCheckout({
    sessionToken: session.token,
    options,
    onSuccess: (result) => {
      if (onSuccess) {
        onSuccess();
      } else if (result.data?.redirect_url) {
        window.location.href = result.data.redirect_url;
      }
    },
    onError: (error) => {
      console.error('Checkout payment error:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    await payCheckout(stripe, elements);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase() === 'EUR' ? '€' : '£';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100).replace('$', symbol);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="paid-invoice-payment-summary">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {session.product.name}
          </h2>
          {session.product.description && (
            <p style={{ fontSize: '0.95rem', color: '#6b7280' }}>
              {session.product.description}
            </p>
          )}
        </div>

        <div className="paid-invoice-payment-row">
          <span>Amount Due:</span>
          <span className="paid-invoice-payment-amount">
            {formatCurrency(pricing.amount, pricing.currency)}
          </span>
        </div>

        {session.customer.email && (
          <div className="paid-invoice-payment-row">
            <span>Email:</span>
            <span>{session.customer.email}</span>
          </div>
        )}
      </div>

      <div className="paid-invoice-payment-form">
        <PaymentElement />

        {state.error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
            fontSize: '0.9rem'
          }}>
            {state.error}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '1.5rem',
          justifyContent: 'flex-end'
        }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={state.isProcessing}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: '#fff',
                color: '#374151',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: state.isProcessing ? 'not-allowed' : 'pointer',
                opacity: state.isProcessing ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!stripe || state.isProcessing}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              background: state.isProcessing ? '#9ca3af' : '#4f46e5',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: (!stripe || state.isProcessing) ? 'not-allowed' : 'pointer',
            }}
          >
            {state.isProcessing
              ? 'Processing...'
              : `Pay ${formatCurrency(pricing.amount, pricing.currency)}`
            }
          </button>
        </div>
      </div>
    </form>
  );
};

export const CheckoutPaymentForm: React.FC<CheckoutPaymentFormProps> = ({
  session,
  stripePublishableKey,
  stripeAccount,
  options,
  onSuccess,
  onCancel,
}) => {
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    if (stripePublishableKey) {
      setStripePromise(loadStripe(stripePublishableKey, stripeAccount ? { stripeAccount } : undefined));
    }
  }, [stripePublishableKey, stripeAccount]);

  if (!stripePromise) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Loading payment form...
      </div>
    );
  }

  if (!session.pricing) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
        Unable to calculate pricing for this checkout session.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount: session.pricing.amount,
        currency: session.pricing.currency.toLowerCase(),
        setup_future_usage: 'off_session',
      }}
    >
      <PaymentForm
        session={session}
        options={options}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};

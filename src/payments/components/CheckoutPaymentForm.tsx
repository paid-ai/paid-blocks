'use client';

import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePayCheckout } from '../hooks/usePayCheckout';
import type { PaymentBillingDetails } from '../hooks/useStripePayment';
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

/**
 * Body returned from POST /complete or /finalize on the Paid backend.
 * After a 3DS challenge, the result here reflects the finalize response
 * (the second round-trip), so consumers can rely on `order_id` /
 * `invoice_id` being present for both sync-success and 3DS flows.
 */
export interface CheckoutCompleteResult {
  success?: boolean;
  data?: {
    status?: 'succeeded' | 'requires_action' | string;
    order_id?: string;
    invoice_id?: string;
    redirect_url?: string | null;
    payment_intent?: {
      id: string;
      status: string;
      client_secret?: string;
    };
  };
  message?: string;
}

/**
 * Where the card form's billing address comes from.
 *
 * - `'auto'` (default): the Payment Element shows its own country and postal
 *   code fields, prefilled from `billingDetails` when given. Without a
 *   default, Stripe guesses the country from the browser's location.
 * - `'never'`: the host page collects the billing address itself. The
 *   Payment Element hides its address fields and the `billingDetails.address`
 *   current at submit time is sent with the confirmation token instead, so
 *   the postal code is validated against the country the customer chose,
 *   not the one they are browsing from.
 */
export type CheckoutBillingAddressFields = 'auto' | 'never';

interface CheckoutPaymentFormProps {
  session: CheckoutSession;
  stripePublishableKey: string;
  stripeAccount?: string;
  customerSessionClientSecret?: string;
  options?: PaidBlocksOptions;
  onSuccess?: (result?: CheckoutCompleteResult) => void;
  onCancel?: () => void;
  /** The customer's billing details as the host page knows them. */
  billingDetails?: PaymentBillingDetails;
  billingAddressFields?: CheckoutBillingAddressFields;
}

interface PaymentFormProps {
  session: CheckoutSession;
  options?: PaidBlocksOptions;
  onSuccess?: (result?: CheckoutCompleteResult) => void;
  onCancel?: () => void;
  billingDetails?: PaymentBillingDetails;
  billingAddressFields: CheckoutBillingAddressFields;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  session,
  options,
  onSuccess,
  onCancel,
  billingDetails,
  billingAddressFields,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  // Read at submit time, so an address the customer finished typing after
  // the element mounted is the one sent to Stripe.
  const billingDetailsRef = useRef(billingDetails);
  billingDetailsRef.current = billingDetails;

  if (!session.pricing) {
    return null;
  }

  const pricing = session.pricing;

  const { state, payCheckout } = usePayCheckout({
    sessionToken: session.token,
    options,
    onSuccess: (result) => {
      if (onSuccess) {
        onSuccess(result as CheckoutCompleteResult);
      } else if (result?.data?.redirect_url) {
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

    await payCheckout(
      stripe,
      elements,
      billingAddressFields === 'never' && billingDetailsRef.current?.address
        ? { address: billingDetailsRef.current.address }
        : undefined,
    );
  };

  const paymentElementOptions = {
    ...(billingDetails ? { defaultValues: { billingDetails } } : {}),
    ...(billingAddressFields === 'never'
      ? { fields: { billingDetails: { address: 'never' as const } } }
      : {}),
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
        <PaymentElement options={paymentElementOptions} />

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
  customerSessionClientSecret,
  options,
  onSuccess,
  onCancel,
  billingDetails,
  billingAddressFields = 'auto',
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
        payment_method_types: ['card'],
        ...(customerSessionClientSecret ? { customerSessionClientSecret } : {}),
      }}
    >
      <PaymentForm
        session={session}
        options={options}
        onSuccess={onSuccess}
        onCancel={onCancel}
        billingDetails={billingDetails}
        billingAddressFields={billingAddressFields}
      />
    </Elements>
  );
};

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
 * The buyer's billing address, when the host page already knows it.
 * `country` is an ISO 3166-1 alpha-2 code such as "US".
 */
export interface CheckoutBillingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

interface CheckoutPaymentFormProps {
  session: CheckoutSession;
  stripePublishableKey: string;
  stripeAccount?: string;
  customerSessionClientSecret?: string;
  options?: PaidBlocksOptions;
  /**
   * Pre-fills the card form's billing country and postcode. Without it,
   * Stripe guesses the country from the browser. The buyer can still change
   * them, and a new value passed later replaces the pre-filled one.
   */
  billingAddress?: CheckoutBillingAddress | null;
  onSuccess?: (result?: CheckoutCompleteResult) => void;
  onCancel?: () => void;
}

interface PaymentFormProps {
  session: CheckoutSession;
  options?: PaidBlocksOptions;
  billingAddress?: CheckoutBillingAddress | null;
  onSuccess?: (result?: CheckoutCompleteResult) => void;
  onCancel?: () => void;
}

const ISO_COUNTRY_CODE = /^[A-Z]{2}$/;

/**
 * Maps the address to the Payment Element's `defaultValues` shape. Empty
 * fields are left out, and so is a country that is not a 2-letter code
 * (a stored name such as "United States"): Stripe only takes ISO codes.
 */
function toPaymentElementAddress(
  address?: CheckoutBillingAddress | null,
): Record<string, string> | undefined {
  if (!address) return undefined;
  const country = address.country?.trim().toUpperCase();
  const fields: Record<string, string | null | undefined> = {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postal_code: address.postalCode,
    country: country && ISO_COUNTRY_CODE.test(country) ? country : undefined,
  };
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    const trimmed = value?.trim();
    if (trimmed) result[key] = trimmed;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ session, options, billingAddress, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const defaultAddress = toPaymentElementAddress(billingAddress);
  // react-stripe-js compares options by value and calls element.update() when
  // they change, so a later address replaces the pre-filled one in place.
  const paymentElementOptions = defaultAddress
    ? { defaultValues: { billingDetails: { address: defaultAddress } } }
    : undefined;

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
  billingAddress,
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
        payment_method_types: ['card'],
        ...(customerSessionClientSecret ? { customerSessionClientSecret } : {}),
      }}
    >
      <PaymentForm
        session={session}
        options={options}
        billingAddress={billingAddress}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};

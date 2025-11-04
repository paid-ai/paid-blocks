'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePayInvoice } from '../hooks/usePayInvoice';
import { PaidBlocksOptions } from '../../utils/apiClient';

interface Invoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  paymentStatus: string;
  invoiceTotal: number;
  currency: string;
}

interface InvoicePaymentModalProps {
  invoice: Invoice;
  stripePublishableKey: string;
  options?: PaidBlocksOptions;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentFormProps {
  invoice: Invoice;
  options?: PaidBlocksOptions;
  onClose: () => void;
  onSuccess?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ invoice, options, onClose, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const { state, payInvoice, resetError } = usePayInvoice({
    invoiceId: invoice.id,
    options,
    onSuccess: () => {
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('Payment error:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    await payInvoice(stripe, elements);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="paid-invoice-payment-summary">
        <div className="paid-invoice-payment-row">
          <span>Amount Due:</span>
          <span className="paid-invoice-payment-amount">
            {formatCurrency(invoice.invoiceTotal, invoice.currency)}
          </span>
        </div>
        <div className="paid-invoice-payment-row">
          <span>Due Date:</span>
          <span>{formatDate(invoice.dueDate)}</span>
        </div>
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
          <button
            type="button"
            onClick={onClose}
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
            {state.isProcessing ? 'Processing...' : `Pay ${formatCurrency(invoice.invoiceTotal, invoice.currency)}`}
          </button>
        </div>
      </div>
    </form>
  );
};

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  invoice,
  stripePublishableKey,
  options,
  onClose,
  onSuccess,
}) => {
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    if (stripePublishableKey) {
      setStripePromise(loadStripe(stripePublishableKey));
    }
  }, [stripePublishableKey]);

  if (!stripePromise) {
    return (
      <div className="paid-invoice-modal-overlay" onClick={onClose}>
        <div className="paid-invoice-modal-content paid-invoice-payment-modal" onClick={(e) => e.stopPropagation()}>
          <div className="paid-invoice-modal-body">
            <p style={{ textAlign: 'center', padding: '2rem' }}>
              Loading payment form...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="paid-invoice-modal-overlay" onClick={onClose}>
      <div className="paid-invoice-modal-content paid-invoice-payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="paid-invoice-modal-header">
          <h3>Pay Invoice INV-{invoice.number}</h3>
          <button
            className="paid-invoice-modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="paid-invoice-modal-body">
          <Elements
            stripe={stripePromise}
            options={{
              mode: 'payment',
              amount: invoice.invoiceTotal,
              currency: invoice.currency.toLowerCase(),
              setup_future_usage: 'off_session',
            }}
          >
            <PaymentForm
              invoice={invoice}
              options={options}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

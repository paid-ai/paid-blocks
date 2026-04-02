import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { PaidBlocksOptions } from "../../utils/apiClient";
import { useListPaymentMethods } from "../hooks/useListPaymentMethods";
import { useRemovePaymentMethod } from "../hooks/useRemovePaymentMethod";
import { useSetDefaultPaymentMethod } from "../hooks/useSetDefaultPaymentMethod";
import { useAddPaymentMethod } from "../hooks/useAddPaymentMethod";
import type { PaymentMethodItem } from "../hooks/useListPaymentMethods";
import '../../styles/paid-payment-methods.css';

export interface PaymentMethodManagerProps {
  token: string;
  stripePublishableKey: string;
  stripeAccount?: string;
  customerSessionClientSecret?: string;
  options?: PaidBlocksOptions;
  onPaymentMethodAdded?: () => void;
  onPaymentMethodRemoved?: () => void;
}

const CARD_ICONS: Record<string, React.ReactNode> = {
  visa: (
    <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="16" rx="2" fill="#1A1F71" />
      <path d="M10.2 10.8H8.7L9.6 5.2H11.1L10.2 10.8Z" fill="white" />
      <path d="M15.3 5.3C15 5.2 14.5 5 13.9 5C12.4 5 11.3 5.8 11.3 6.9C11.3 7.7 12 8.2 12.6 8.4C13.2 8.7 13.4 8.9 13.4 9.1C13.4 9.4 13 9.6 12.7 9.6C12.2 9.6 11.9 9.5 11.4 9.3L11.2 9.2L11 10.4C11.4 10.6 12 10.7 12.7 10.7C14.3 10.7 15.3 9.9 15.3 8.8C15.3 8.1 14.9 7.6 14 7.2C13.5 6.9 13.2 6.8 13.2 6.5C13.2 6.3 13.5 6.1 13.9 6.1C14.3 6.1 14.7 6.2 14.9 6.3L15.1 6.4L15.3 5.3Z" fill="white" />
      <path d="M17.1 5.2H16C15.7 5.2 15.5 5.3 15.4 5.6L13.3 10.8H14.9L15.2 9.9H17.2L17.3 10.8H18.7L17.5 5.2H17.1ZM15.7 8.7C15.8 8.4 16.4 6.8 16.4 6.8L16.7 8.7H15.7Z" fill="white" />
      <path d="M8.3 5.2L6.8 8.9L6.6 7.9C6.3 6.9 5.4 5.8 4.4 5.3L5.8 10.8H7.4L9.9 5.2H8.3Z" fill="white" />
      <path d="M6.1 5.2H3.6L3.6 5.3C5.4 5.8 6.6 6.9 7 8L6.5 5.6C6.5 5.3 6.3 5.2 6.1 5.2Z" fill="#F9A533" />
    </svg>
  ),
  mastercard: (
    <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="16" rx="2" fill="#252525" />
      <circle cx="9.5" cy="8" r="4.5" fill="#EB001B" />
      <circle cx="14.5" cy="8" r="4.5" fill="#F79E1B" />
      <path d="M12 4.5C13 5.3 13.6 6.6 13.6 8C13.6 9.4 13 10.7 12 11.5C11 10.7 10.4 9.4 10.4 8C10.4 6.6 11 5.3 12 4.5Z" fill="#FF5F00" />
    </svg>
  ),
  amex: (
    <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="16" rx="2" fill="#2557D6" />
      <text x="12" y="10" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold" fontFamily="sans-serif">AMEX</text>
    </svg>
  ),
  discover: (
    <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="16" rx="2" fill="#fff" stroke="#e5e7eb" />
      <circle cx="14" cy="8" r="4" fill="#F76F20" />
      <text x="6" y="10" fill="#1d2939" fontSize="4" fontWeight="bold" fontFamily="sans-serif">D</text>
    </svg>
  ),
};

function getCardIcon(brand: string) {
  const key = brand.toLowerCase();
  if (CARD_ICONS[key]) {
    return <span className="paid-pm-card-icon">{CARD_ICONS[key]}</span>;
  }
  return (
    <span className="paid-pm-card-icon">
      <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="16" rx="2" fill="#f3f4f6" stroke="#e5e7eb" />
        <rect x="3" y="4" width="18" height="2" rx="1" fill="#d0d5dd" />
        <rect x="3" y="8" width="10" height="1.5" rx=".75" fill="#d0d5dd" />
        <rect x="3" y="11" width="6" height="1.5" rx=".75" fill="#d0d5dd" />
      </svg>
    </span>
  );
}

function PaymentMethodRow({
  method,
  onRemove,
  onEdit,
  onSetDefault,
  isRemoving,
  isEditing,
  isSettingDefault,
  isLast,
}: {
  method: PaymentMethodItem;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onSetDefault: (id: string) => void;
  isRemoving: boolean;
  isEditing: boolean;
  isSettingDefault: boolean;
  isLast: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemove = () => {
    if (isLast && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    onRemove(method.id);
  };

  return (
    <>
      <div className="paid-pm-row">
        <div className="paid-pm-row-info">
          {method.card ? (
            <>
              {getCardIcon(method.card.brand)}
              <div className="paid-pm-card-details">
                <span className="paid-pm-card-number">
                  •••• {method.card.last4}
                </span>
                <span className="paid-pm-card-expiry">
                  {String(method.card.expMonth).padStart(2, "0")}/{method.card.expYear}
                </span>
                {method.isDefault && (
                  <span className="paid-pm-default-badge">Default</span>
                )}
              </div>
            </>
          ) : (
            <>
              {getCardIcon("")}
              <div className="paid-pm-card-details">
                <span className="paid-pm-card-number">{method.type}</span>
              </div>
            </>
          )}
        </div>
        <div className="paid-pm-row-actions">
          {!method.isDefault && (
            <button
              className="paid-pm-set-default-btn"
              onClick={() => onSetDefault(method.id)}
              disabled={isRemoving || isEditing || isSettingDefault}
            >
              {isSettingDefault ? "Setting…" : "Set as default"}
            </button>
          )}
          <button
            className="paid-pm-edit-btn"
            onClick={() => onEdit(method.id)}
            disabled={isRemoving || isEditing || isSettingDefault}
          >
            Replace
          </button>
          <button
            className="paid-pm-remove-btn"
            onClick={handleRemove}
            disabled={isRemoving || isEditing || isSettingDefault}
          >
            {isRemoving ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
      {showConfirm && (
        <div className="paid-pm-confirm">
          <p className="paid-pm-confirm-text">
            This is your only payment method. Removing it may prevent automatic payments.
          </p>
          <div className="paid-pm-confirm-actions">
            <button
              className="paid-pm-cancel-btn"
              onClick={() => setShowConfirm(false)}
            >
              Keep it
            </button>
            <button
              className="paid-pm-confirm-remove-btn"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing…" : "Remove anyway"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ReplacePaymentMethodForm({
  token,
  options,
  onSuccess,
  onCancel,
}: {
  token: string;
  options?: PaidBlocksOptions;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { state, addPaymentMethod, resetError } = useAddPaymentMethod({
    token,
    options,
    onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    await addPaymentMethod(stripe, elements);
  };

  return (
    <form onSubmit={handleSubmit} className="paid-pm-add-form">
      <PaymentElement />
      {state.error && (
        <div className="paid-pm-error">{state.error}</div>
      )}
      <div className="paid-pm-add-actions">
        <button
          type="button"
          className="paid-pm-cancel-btn"
          onClick={onCancel}
          disabled={state.isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="paid-pm-save-btn"
          disabled={!stripe || state.isProcessing}
        >
          {state.isProcessing ? "Saving…" : "Replace card"}
        </button>
      </div>
    </form>
  );
}

function AddPaymentMethodForm({
  token,
  options,
  onSuccess,
  onCancel,
}: {
  token: string;
  options?: PaidBlocksOptions;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { state, addPaymentMethod, resetError } = useAddPaymentMethod({
    token,
    options,
    onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetError();
    await addPaymentMethod(stripe, elements);
  };

  return (
    <form onSubmit={handleSubmit} className="paid-pm-add-form">
      <PaymentElement />
      {state.error && (
        <div className="paid-pm-error">{state.error}</div>
      )}
      <div className="paid-pm-add-actions">
        <button
          type="button"
          className="paid-pm-cancel-btn"
          onClick={onCancel}
          disabled={state.isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="paid-pm-save-btn"
          disabled={!stripe || state.isProcessing}
        >
          {state.isProcessing ? "Saving…" : "Save card"}
        </button>
      </div>
    </form>
  );
}

export function PaymentMethodManager({
  token,
  stripePublishableKey,
  stripeAccount,
  customerSessionClientSecret,
  options,
  onPaymentMethodAdded,
  onPaymentMethodRemoved,
}: PaymentMethodManagerProps) {
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);

  useEffect(() => {
    if (stripePublishableKey) {
      setStripePromise(
        loadStripe(
          stripePublishableKey,
          stripeAccount ? { stripeAccount } : undefined,
        ),
      );
    }
  }, [stripePublishableKey, stripeAccount]);

  const { paymentMethods, isLoading, error, refetch } = useListPaymentMethods(
    token,
    options,
  );

  const { removePaymentMethod, isRemoving } = useRemovePaymentMethod(
    token,
    options,
    () => {
      refetch();
      onPaymentMethodRemoved?.();
    },
  );

  const { setDefaultPaymentMethod, isSettingDefault } = useSetDefaultPaymentMethod(
    token,
    options,
    () => {
      refetch();
    },
  );

  const handleAdded = () => {
    setShowAddForm(false);
    refetch();
    onPaymentMethodAdded?.();
  };

  const handleReplaced = () => {
    const oldMethodId = editingMethodId;
    setEditingMethodId(null);
    refetch();
    onPaymentMethodAdded?.();
    // Remove the old card after the new one is saved
    if (oldMethodId) {
      removePaymentMethod(oldMethodId);
    }
  };

  if (isLoading) {
    return <div className="paid-pm-loading">Loading payment methods…</div>;
  }

  if (error) {
    return <div className="paid-pm-error">{error}</div>;
  }

  return (
    <div className="paid-pm-manager">
      {paymentMethods.length === 0 && !showAddForm && (
        <div className="paid-pm-empty">No payment methods on file</div>
      )}

      {paymentMethods.length > 0 && (
        <div className="paid-pm-list">
          {paymentMethods.map((method) => (
            <React.Fragment key={method.id}>
              <PaymentMethodRow
                method={method}
                onRemove={removePaymentMethod}
                onEdit={setEditingMethodId}
                onSetDefault={setDefaultPaymentMethod}
                isRemoving={isRemoving}
                isEditing={editingMethodId === method.id}
                isSettingDefault={isSettingDefault}
                isLast={paymentMethods.length === 1}
              />
              {editingMethodId === method.id && stripePromise && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    mode: "setup" as any,
                    currency: "usd",
                  }}
                >
                  <ReplacePaymentMethodForm
                    token={token}
                    options={options}
                    onSuccess={handleReplaced}
                    onCancel={() => setEditingMethodId(null)}
                  />
                </Elements>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {showAddForm && stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{
            mode: "setup" as any,
            currency: "usd",
          }}
        >
          <AddPaymentMethodForm
            token={token}
            options={options}
            onSuccess={handleAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </Elements>
      ) : (
        !showAddForm && !editingMethodId && (
          <button
            className="paid-pm-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add payment method
          </button>
        )
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { PaidBlocksOptions } from "../../utils/apiClient";
import { useListPaymentMethods } from "../hooks/useListPaymentMethods";
import { useRemovePaymentMethod } from "../hooks/useRemovePaymentMethod";
import { useAddPaymentMethod } from "../hooks/useAddPaymentMethod";
import type { PaymentMethodItem } from "../hooks/useListPaymentMethods";

export interface PaymentMethodManagerProps {
  token: string;
  stripePublishableKey: string;
  stripeAccount?: string;
  customerSessionClientSecret?: string;
  options?: PaidBlocksOptions;
  onPaymentMethodAdded?: () => void;
  onPaymentMethodRemoved?: () => void;
}

function CardIcon({ brand }: { brand: string }) {
  const label = brand.charAt(0).toUpperCase() + brand.slice(1);
  return <span className="paid-pm-card-brand">{label}</span>;
}

function PaymentMethodRow({
  method,
  onRemove,
  isRemoving,
}: {
  method: PaymentMethodItem;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  return (
    <div className="paid-pm-row">
      <div className="paid-pm-row-info">
        {method.card ? (
          <>
            <CardIcon brand={method.card.brand} />
            <span className="paid-pm-card-last4">
              &bull;&bull;&bull;&bull; {method.card.last4}
            </span>
            <span className="paid-pm-card-expiry">
              {String(method.card.expMonth).padStart(2, "0")}/{method.card.expYear}
            </span>
          </>
        ) : (
          <span className="paid-pm-type">{method.type}</span>
        )}
      </div>
      <button
        className="paid-pm-remove-btn"
        onClick={() => onRemove(method.id)}
        disabled={isRemoving}
      >
        {isRemoving ? "Removing..." : "Remove"}
      </button>
    </div>
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
          {state.isProcessing ? "Saving..." : "Save card"}
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

  const handleAdded = () => {
    setShowAddForm(false);
    refetch();
    onPaymentMethodAdded?.();
  };

  if (isLoading) {
    return <div className="paid-pm-loading">Loading payment methods...</div>;
  }

  if (error) {
    return <div className="paid-pm-error">{error}</div>;
  }

  return (
    <div className="paid-pm-manager">
      {paymentMethods.length === 0 && !showAddForm && (
        <div className="paid-pm-empty">No payment methods on file.</div>
      )}

      {paymentMethods.map((method) => (
        <PaymentMethodRow
          key={method.id}
          method={method}
          onRemove={removePaymentMethod}
          isRemoving={isRemoving}
        />
      ))}

      {showAddForm && stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{
            mode: "setup" as any,
            currency: "usd",
            ...(customerSessionClientSecret
              ? { customerSessionClientSecret }
              : {}),
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
        !showAddForm && (
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

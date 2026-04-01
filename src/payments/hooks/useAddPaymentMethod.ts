import { useCallback } from "react";
import { fetchPaidData, PaidBlocksOptions } from "../../utils/apiClient";
import { useStripePayment } from "./useStripePayment";

interface UseAddPaymentMethodOptions {
  token: string;
  options?: PaidBlocksOptions;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface UseAddPaymentMethodResult {
  state: {
    isProcessing: boolean;
    error: string | null;
    isComplete: boolean;
  };
  addPaymentMethod: (stripe: any, elements: any) => Promise<void>;
  resetError: () => void;
}

export function useAddPaymentMethod({
  token,
  options,
  onSuccess,
  onError,
}: UseAddPaymentMethodOptions): UseAddPaymentMethodResult {
  const { state, processPayment, resetError } = useStripePayment({
    onSuccess,
    onError,
  });

  const addPaymentMethod = useCallback(
    async (stripe: any, elements: any) => {
      if (!stripe || !elements || !token) {
        return;
      }

      await processPayment(stripe, elements, async (confirmationToken, returnUrl) => {
        return fetchPaidData({
          paidEndpoint: "add-payment-method",
          portalToken: token,
          body: {
            confirmationToken,
            returnUrl,
          },
          options,
        }) as any;
      });
    },
    [token, options, processPayment],
  );

  return {
    state,
    addPaymentMethod,
    resetError,
  };
}

import { useCallback } from 'react';
import { fetchPaidData, PaidBlocksOptions } from '../../utils/apiClient';
import { useStripePayment } from './useStripePayment';

interface UsePayCheckoutOptions {
  sessionToken: string;
  options?: PaidBlocksOptions;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface UsePayCheckoutResult {
  state: {
    isProcessing: boolean;
    error: string | null;
    isComplete: boolean;
  };
  payCheckout: (stripe: any, elements: any) => Promise<void>;
  resetError: () => void;
}

export function usePayCheckout({
  sessionToken,
  options,
  onSuccess,
  onError,
}: UsePayCheckoutOptions): UsePayCheckoutResult {
  const { state, processPayment, resetError } = useStripePayment({
    onSuccess,
    onError,
  });

  const payCheckout = useCallback(
    async (stripe: any, elements: any) => {
      if (!stripe || !elements || !sessionToken) {
        return;
      }

      await processPayment(stripe, elements, async (confirmationToken, returnUrl) => {
        return fetchPaidData({
          paidEndpoint: 'complete-checkout',
          sessionToken,
          body: {
            confirmation_token: confirmationToken,
            return_url: returnUrl,
          },
          options,
        }) as any;
      });
    },
    [sessionToken, options, processPayment],
  );

  return {
    state,
    payCheckout,
    resetError,
  };
}

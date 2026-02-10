import { useCallback } from 'react';
import { fetchPaidData, PaidBlocksOptions } from '../../utils/apiClient';
import { useStripePayment } from './useStripePayment';

interface UsePayInvoiceOptions {
  invoiceId: string;
  options?: PaidBlocksOptions;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface UsePayInvoiceResult {
  state: {
    isProcessing: boolean;
    error: string | null;
    isComplete: boolean;
  };
  payInvoice: (stripe: any, elements: any) => Promise<void>;
  resetError: () => void;
}

export function usePayInvoice({
  invoiceId,
  options,
  onSuccess,
  onError,
}: UsePayInvoiceOptions): UsePayInvoiceResult {
  const { state, processPayment, resetError } = useStripePayment({
    onSuccess,
    onError,
  });

  const payInvoice = useCallback(
    async (stripe: any, elements: any) => {
      if (!stripe || !elements || !invoiceId) {
        return;
      }

      await processPayment(stripe, elements, async (confirmationToken, returnUrl) => {
        return fetchPaidData({
          paidEndpoint: 'pay-invoice',
          invoiceId,
          body: {
            invoiceId,
            confirmationToken,
            returnUrl,
          },
          options,
        }) as any;
      });
    },
    [invoiceId, options, processPayment],
  );

  return {
    state,
    payInvoice,
    resetError,
  };
}

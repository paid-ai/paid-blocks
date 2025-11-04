import { useState, useCallback, useRef } from 'react';
import { fetchPaidData, PaidBlocksOptions } from '../../utils/apiClient';

interface PayInvoiceState {
  isProcessing: boolean;
  error: string | null;
  isComplete: boolean;
}

interface UsePayInvoiceOptions {
  invoiceId: string;
  options?: PaidBlocksOptions;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface UsePayInvoiceResult {
  state: PayInvoiceState;
  payInvoice: (stripe: any, elements: any) => Promise<void>;
  resetError: () => void;
}

export function usePayInvoice({
  invoiceId,
  options,
  onSuccess,
  onError,
}: UsePayInvoiceOptions): UsePayInvoiceResult {
  const [state, setState] = useState<PayInvoiceState>({
    isProcessing: false,
    error: null,
    isComplete: false,
  });

  const isProcessingRef = useRef(false);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const payInvoice = useCallback(
    async (stripe: any, elements: any) => {
      if (!stripe || !elements || !invoiceId) {
        return;
      }

      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        // Submit the payment element
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new Error(submitError.message);
        }

        // Create confirmation token with setup_future_usage
        const { error: tokenError, confirmationToken } =
          await stripe.createConfirmationToken({
            elements,
            params: {
              setup_future_usage: 'off_session',
              payment_method_data: {
                allow_redisplay: 'always',
              },
            },
          });

        if (tokenError) {
          throw new Error(
            tokenError.message || 'Failed to create confirmation token',
          );
        }

        if (!confirmationToken) {
          throw new Error('No confirmation token received');
        }

        // Call pay invoice API
        const response = await fetchPaidData({
          paidEndpoint: 'pay-invoice',
          invoiceId,
          body: {
            invoiceId,
            confirmationToken: confirmationToken.id,
            returnUrl: window.location.href,
          },
          options,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process payment');
        }

        const result = await response.json();

        // Handle requires_action for 3D Secure
        const paymentIntent = result.data?.payment_intent;
        if (paymentIntent?.status === 'requires_action' && paymentIntent?.client_secret) {
          const { error: nextErr } = await stripe.handleNextAction({
            clientSecret: paymentIntent.client_secret,
          });
          if (nextErr) {
            throw new Error(nextErr.message || 'Authentication failed');
          }
        }

        isProcessingRef.current = false;
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          isComplete: true,
        }));

        if (onSuccess) {
          onSuccess(result);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Payment failed';
        isProcessingRef.current = false;
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
          isComplete: false,
        }));

        if (onError) {
          onError(errorMessage);
        }
      }
    },
    [invoiceId, options, onSuccess, onError],
  );

  return {
    state,
    payInvoice,
    resetError,
  };
}

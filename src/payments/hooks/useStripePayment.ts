import { useState, useCallback, useRef } from 'react';

interface StripePaymentState {
  isProcessing: boolean;
  error: string | null;
  isComplete: boolean;
}

interface UseStripePaymentOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface UseStripePaymentResult {
  state: StripePaymentState;
  processPayment: (
    stripe: any,
    elements: any,
    submitFn: (confirmationToken: string, returnUrl: string) => Promise<Response>
  ) => Promise<void>;
  resetError: () => void;
}

export function useStripePayment({
  onSuccess,
  onError,
}: UseStripePaymentOptions): UseStripePaymentResult {
  const [state, setState] = useState<StripePaymentState>({
    isProcessing: false,
    error: null,
    isComplete: false,
  });

  const isProcessingRef = useRef(false);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const processPayment = useCallback(
    async (
      stripe: any,
      elements: any,
      submitFn: (confirmationToken: string, returnUrl: string) => Promise<any>
    ) => {
      if (!stripe || !elements) {
        return;
      }

      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new Error(submitError.message);
        }

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

        const response = await submitFn(confirmationToken.id, window.location.href);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process payment');
        }

        const result = await response.json();

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
    [onSuccess, onError],
  );

  return {
    state,
    processPayment,
    resetError,
  };
}

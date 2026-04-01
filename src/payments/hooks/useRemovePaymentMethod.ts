import { useState, useCallback } from "react";
import { fetchPaidData, PaidBlocksOptions } from "../../utils/apiClient";

interface UseRemovePaymentMethodResult {
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  isRemoving: boolean;
  error: string | null;
}

export function useRemovePaymentMethod(
  token: string,
  options?: PaidBlocksOptions,
  onSuccess?: () => void,
): UseRemovePaymentMethodResult {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removePaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      setIsRemoving(true);
      setError(null);
      try {
        await fetchPaidData({
          paidEndpoint: "remove-payment-method",
          portalToken: token,
          body: { paymentMethodId },
          options,
        });
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove payment method");
      } finally {
        setIsRemoving(false);
      }
    },
    [token, options, onSuccess],
  );

  return { removePaymentMethod, isRemoving, error };
}

import { useState, useCallback } from "react";
import { fetchPaidData, PaidBlocksOptions } from "../../utils/apiClient";

interface UseSetDefaultPaymentMethodResult {
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  isSettingDefault: boolean;
  error: string | null;
}

export function useSetDefaultPaymentMethod(
  token: string,
  options?: PaidBlocksOptions,
  onSuccess?: () => void,
): UseSetDefaultPaymentMethodResult {
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    setIsSettingDefault(true);
    setError(null);
    try {
      await fetchPaidData({
        paidEndpoint: "set-default-payment-method",
        portalToken: token,
        body: { paymentMethodId },
        options,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default payment method");
    } finally {
      setIsSettingDefault(false);
    }
  }, [token, options, onSuccess]);

  return { setDefaultPaymentMethod, isSettingDefault, error };
}

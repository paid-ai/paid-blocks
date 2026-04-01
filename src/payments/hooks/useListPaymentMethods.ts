import { useState, useEffect, useCallback } from "react";
import { fetchPaidData, PaidBlocksOptions } from "../../utils/apiClient";

export interface PaymentMethodItem {
  id: string;
  externalPaymentMethodId: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  createdAt: string;
}

interface UseListPaymentMethodsResult {
  paymentMethods: PaymentMethodItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useListPaymentMethods(
  token: string,
  options?: PaidBlocksOptions,
): UseListPaymentMethodsResult {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchPaidData({
        paidEndpoint: "payment-methods",
        portalToken: token,
        options,
      });
      const json = await response.json();
      const data = json?.data ?? json ?? [];
      setPaymentMethods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment methods");
    } finally {
      setIsLoading(false);
    }
  }, [token, options]);

  useEffect(() => {
    if (token) {
      fetchMethods();
    }
  }, [token, fetchMethods]);

  return { paymentMethods, isLoading, error, refetch: fetchMethods };
}

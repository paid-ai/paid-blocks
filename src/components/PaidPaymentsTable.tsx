'use client';

import React, { useEffect, useState } from 'react';
import { useIsInContainer } from './PaidContainer';
import { getCacheKey } from '../utils/cache';
import { Pagination } from './ui/Pagination';
import '../styles/paid-payments-table.css';
import { fetchPaidData } from '../utils/apiClient';

interface PaidStyleProperties {
    // Global - Font
    fontFamily?: string;
    
    // Global - Font Colors
    primaryColor?: string;
    secondaryColor?: string;
    
    // Background Colors
    containerBackgroundColor?: string;
    tableBackgroundColor?: string;
    tableHeaderBackgroundColor?: string;
    
    // Tab Colors
    tabBackgroundColor?: string;
    tabActiveBackgroundColor?: string;
    tabHoverBackgroundColor?: string;
    
    // Table Hover
    tableHoverColor?: string;
    
    // Button Background (Status badges & Pagination)
    buttonBgColor?: string;
}

interface Payment {
    id: string;
    paymentType: string;
    paymentDate: string;
    paymentStatus: string;
    amount: number;
    currency: string;
}

interface PaymentApiResponse {
    data: Payment[];
}

interface PaidPaymentsTableProps {
    customerExternalId: string;
    paidStyle?: PaidStyleProperties;
}

export const PaidPaymentsTable: React.FC<PaidPaymentsTableProps> = ({ 
    customerExternalId, 
    paidStyle = {}
}) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const isInContainer = useIsInContainer();

    // Calculate pagination
    const totalPages = Math.ceil(payments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPayments = payments.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Convert paidStyle entries into CSS custom properties
    const cssVariables: React.CSSProperties = Object.entries(paidStyle).reduce((vars, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            // Map simplified properties to CSS custom properties
            const propertyMap: Record<string, string> = {
                fontFamily: '--paid-font-family',
                primaryColor: '--paid-primary-color',
                secondaryColor: '--paid-secondary-color',
                containerBackgroundColor: '--paid-container-background-color',
                tableBackgroundColor: '--paid-table-background-color',
                tableHeaderBackgroundColor: '--paid-table-header-background-color',
                tabBackgroundColor: '--paid-tab-background-color',
                tabActiveBackgroundColor: '--paid-tab-active-background-color',
                tabHoverBackgroundColor: '--paid-tab-hover-background-color',
                tableHoverColor: '--paid-table-hover-color',
                buttonBgColor: '--paid-button-bg-color'
            };

            const cssProperty = propertyMap[key];
            if (cssProperty) {
                // @ts-ignore allow custom property
                vars[cssProperty] = value;
            }
        }
        
        return vars;
    }, {} as React.CSSProperties);

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = getCurrencySymbol(currency);
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount / 100).replace('$', symbol);
    };

    const getCurrencySymbol = (currency: string) => {
        switch (currency.toUpperCase()) {
            case 'USD':
                return '$';
            case 'EUR':
                return '€';
            case 'GBP':
                return '£';
            default:
                return '$'; // Default to USD symbol
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        // Handle undefined/null status
        if (!status) {
            return <span className="paid-payment-status">Unknown</span>;
        }
        
        const statusClass = `paid-payment-status paid-payment-status-${status.toLowerCase()}`;
        const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        return <span className={statusClass}>{displayStatus}</span>;
    };

    useEffect(() => {
        const fetchPaymentData = async () => {
            try {
                setLoading(true);
                console.log('PaidPaymentsTable: Fetching payment data for', customerExternalId);
                
                // Use cached fetch for payment data
                const cacheKey = getCacheKey.payments(customerExternalId);
                console.log('PaidPaymentsTable: Using cache key', cacheKey);
                
                const response = await fetchPaidData({
                    paidEndpoint: 'payments',
                    customerExternalId
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json() as PaymentApiResponse;
                console.log('PaidPaymentsTable: Received data', data);
                setPayments(data.data || []);
            } catch (err) {
                console.error('PaidPaymentsTable: Error fetching data', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentData();

        // Listen for cache refresh events
        const handleCacheRefresh = (event: CustomEvent) => {
            console.log('PaidPaymentsTable: Cache refresh event received', event.detail);
            if (event.detail?.customerId === customerExternalId || event.detail?.type === 'all') {
                console.log('PaidPaymentsTable: Refetching data due to cache refresh');
                fetchPaymentData();
            }
        };

        window.addEventListener('cache-refresh', handleCacheRefresh as EventListener);

        return () => {
            window.removeEventListener('cache-refresh', handleCacheRefresh as EventListener);
        };
    }, [customerExternalId]);

    if (loading) {
        return <div>Loading payment data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="paid-payment-container" style={{ position: 'relative', minWidth: 0, ...cssVariables }}>
            <div className="paid-payment-table-wrapper" style={{ position: 'relative', width: '100%', height: 'auto', left: undefined, top: undefined, boxShadow: undefined, cursor: undefined }}>
                {!isInContainer && (
                    <div className="paid-payment-header">
                        <h3 className="paid-payment-title">Payments</h3>
                    </div>
                )}
                <div style={{ background: '#fff', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
                    <table className="paid-payment-table" style={{ width: '100%', maxWidth: '100%', tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th>Payment Number</th>
                                <th>Payment type</th>
                                <th>Due date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="paid-payment-empty">
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                currentPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td style={{ fontWeight: 500 }}>
                                            <div className="paid-payment-number">
                                                <span>PAY-1</span>
                                            </div>
                                        </td>
                                        <td>{payment.paymentType}</td>
                                        <td>{formatDate(payment.paymentDate)}</td>
                                        <td>{getStatusBadge(payment.paymentStatus)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="paid-payment-amount">
                                                <span className="amount-number">{formatCurrency(payment.amount, payment.currency)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};

export default PaidPaymentsTable;

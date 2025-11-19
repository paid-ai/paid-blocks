'use client';

import React, { useEffect, useState } from 'react';
import { useIsInContainer } from './PaidContainer';
import { Pagination } from './ui/Pagination';
import { fetchPaidData } from '../utils/apiClient';
import '../styles/paid-usage-table.css';

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

interface UsageSummary {
    id: string;
    updatedAt: string;
    createdAt: string;
    eventName: string;
    eventsQuantity: number;
    startDate: string;
    endDate: string;
    subtotal: number;
    nextBillingDate: string;
    accountId: string;
    orderId: string;
    orderLineId: string;
    orderLineAttributeId: string;
    invoiceId: string | null;
    invoiceLineId: string | null;
    currency?: string;
}

interface UsageApiResponse {
    data: {
        usageSummary: UsageSummary[];
    };
}

interface PaidUsageTableProps {
    customerExternalId: string;
    paidStyle?: PaidStyleProperties;
}

export const PaidUsageTable: React.FC<PaidUsageTableProps> = ({ 
    customerExternalId, 
    paidStyle = {}
}) => {
    const [usageSummaries, setUsageSummaries] = useState<UsageSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const isInContainer = useIsInContainer();

    // Calculate pagination
    const totalPages = Math.ceil(usageSummaries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsageSummaries = usageSummaries.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Convert paidStyle entries into CSS custom properties
    const cssVariables: React.CSSProperties = Object.entries(paidStyle).reduce((vars, [key, value]) => {
        // Only set CSS variables if they are explicitly provided
        // This allows inheritance from parent PaidContainer
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

    const formatCurrency = (amount: number, currency?: string) => {
        const symbol = getCurrencySymbol(currency || 'USD');
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

    const formatEventName = (eventName: string) => {
        return eventName
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    useEffect(() => {
        const fetchUsageData = async () => {
            try {
                setLoading(true);
                
                // Use new API client for usage data
                const response = await fetchPaidData({
                    paidEndpoint: 'usage',
                    customerExternalId
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json() as UsageApiResponse;
                const mappedUsageSummaries = (data.data.usageSummary || []).map((summary: any) => ({
                    ...summary,
                    accountId: summary.customerId,
                }));
                setUsageSummaries(mappedUsageSummaries);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchUsageData();

        // Listen for cache refresh events
        const handleCacheRefresh = (event: CustomEvent) => {
            if (event.detail?.customerId === customerExternalId || event.detail?.type === 'all') {
                fetchUsageData();
            }
        };

        window.addEventListener('cache-refresh', handleCacheRefresh as EventListener);

        return () => {
            window.removeEventListener('cache-refresh', handleCacheRefresh as EventListener);
        };
    }, [customerExternalId]);

    if (loading) {
        return <div>Loading usage data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="paid-usage-table-container" style={{ position: 'relative', minWidth: 0, ...cssVariables }}>
            <div className="paid-usage-table-table-wrapper" style={{ position: 'relative', width: '100%', height: 'auto', left: undefined, top: undefined, boxShadow: undefined, cursor: undefined }}>
                {!isInContainer && (
                    <div className="paid-usage-table-header">
                        <h3 className="paid-usage-table-title">Usage Table</h3>
                    </div>
                )}
                <div style={{ background: '#fff', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
                    <table className="paid-usage-table-table" style={{ width: '100%', maxWidth: '100%', tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th style={{ textAlign: 'center' }}>Current Usage</th>
                                <th style={{ textAlign: 'center' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentUsageSummaries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="paid-usage-table-empty">
                                        No usage data found
                                    </td>
                                </tr>
                            ) : (
                                currentUsageSummaries.map((summary) => (
                                    <tr key={summary.id}>
                                        <td style={{ fontWeight: 500 }}>{formatEventName(summary.eventName)}</td>
                                        <td>{formatDate(summary.startDate)}</td>
                                        <td>{formatDate(summary.endDate)}</td>
                                        <td style={{ textAlign: 'center' }}>{summary.eventsQuantity}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 500 }}>{formatCurrency(summary.subtotal, summary.currency)}</td>
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
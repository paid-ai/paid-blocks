'use client';

import React, { useEffect, useState } from 'react';
import { useIsInContainer } from './PaidContainer';
import { cachedFetch, getCacheKey, CACHE_TTL } from '../utils/cache';
import { Pagination } from './ui/Pagination';
import '../styles/activity-log-table.css';

interface PaidStyleProperties {
    paidTitleColor?: string;
    paidTitleFontWeight?: string;
    paidFontFamily?: string;
    paidWrapperBorder?: string;
    paidHeaderBorderBottom?: string;
    paidThBorderBottom?: string;
    paidTdBorderBottom?: string;
    paidTdBg?: string;
    paidTdFontWeight?: string;
    paidTitleFontSize?: string;
    paidToggleFontSize?: string;
    paidToggleFontWeight?: string;
    paidToggleColor?: string;
    paidThFontSize?: string;
    paidThFontWeight?: string;
    paidThColor?: string;
    paidTdFontSize?: string;
    paidTdColor?: string;
    paidEmptyColor?: string;
    paidWrapperBg?: string;
    paidHeaderBg?: string;
    paidTableBg?: string;
    paidThBg?: string;
    paidRowHoverBg?: string;
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

interface PaidActivityLogProps {
    accountExternalId: string;
    paidStyle?: PaidStyleProperties;
}

export const PaidActivityLog: React.FC<PaidActivityLogProps> = ({ 
    accountExternalId, 
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
        let varName: string;
        if (key.startsWith('--')) {
            varName = key;
        } else {
            const raw = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            varName = raw.startsWith('--') ? raw : `--${raw}`;
        }
        // @ts-ignore allow custom property
        vars[varName] = value;
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
                
                // Use cached fetch for usage data
                const cacheKey = getCacheKey.usage(accountExternalId);
                const data = await cachedFetch<UsageApiResponse>(
                    `/api/usage/${accountExternalId}`,
                    cacheKey,
                    CACHE_TTL.DATA
                );
                
                // TEMPORARILY DISABLED: Direct fetch without caching
                // const response = await fetch(`/api/usage/${accountExternalId}`);
                // if (!response.ok) {
                //     throw new Error(`Failed to fetch: ${response.statusText}`);
                // }
                // const data = await response.json();
                
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
    }, [accountExternalId]);

    if (loading) {
        return <div>Loading usage data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="paid-activity-log-container" style={{ position: 'relative', minWidth: 0, ...cssVariables }}>
            <div className="paid-activity-log-table-wrapper" style={{ position: 'relative', width: '100%', height: 'auto', left: undefined, top: undefined, boxShadow: undefined, cursor: undefined }}>
                {!isInContainer && (
                    <div className="paid-activity-log-header">
                        <h3 className="paid-activity-log-title">Activity Log</h3>
                    </div>
                )}
                <div style={{ background: '#fff', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
                    <table className="paid-activity-log-table" style={{ width: '100%', maxWidth: '100%', tableLayout: 'fixed' }}>
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
                                    <td colSpan={5} className="paid-activity-log-empty">
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
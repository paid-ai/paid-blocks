'use client';

import React, { useEffect, useState } from 'react';
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
}

interface PaidActivityLogProps {
    accountExternalId: string;
    host?: string;
    paidStyle?: PaidStyleProperties; // make it a seperate interface
}

export const PaidActivityLog: React.FC<PaidActivityLogProps> = ({ accountExternalId, host, paidStyle = {} }) => {
    const [usageSummaries, setUsageSummaries] = useState<UsageSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount / 100);
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
                const response = await fetch(`/api/usage/${accountExternalId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch usage data');
                }

                const data = await response.json();
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

    const displayedSummaries = showAll ? usageSummaries : usageSummaries.slice(0, 4);
    const hasMoreSummaries = usageSummaries.length > 4;

    if (loading) {
        return <div>Loading usage data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="paid-activity-log-container" style={{ position: 'relative', minWidth: 0, ...cssVariables }}>
            <div className="paid-activity-log-table-wrapper" style={{ position: 'static', width: '100%', height: 'auto', left: undefined, top: undefined, boxShadow: undefined, cursor: undefined }}>
                <div className="paid-activity-log-header">
                    <h3 className="paid-activity-log-title">Paid.ai Activity Log</h3>
                    {hasMoreSummaries && (
                        <button 
                            onClick={() => setShowAll(!showAll)}
                            className="paid-activity-log-toggle-btn"
                        >
                            {showAll ? 'Show less' : 'Show all usage'}
                        </button>
                    )}
                </div>
                <div style={{ background: '#fff', overflow: 'auto' }}>
                    <table className="paid-activity-log-table">
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
                            {displayedSummaries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="paid-activity-log-empty">
                                        No usage data found
                                    </td>
                                </tr>
                            ) : (
                                displayedSummaries.map((summary) => (
                                    <tr key={summary.id}>
                                        <td style={{ fontWeight: 500 }}>{formatEventName(summary.eventName)}</td>
                                        <td>{formatDate(summary.startDate)}</td>
                                        <td>{formatDate(summary.endDate)}</td>
                                        <td style={{ textAlign: 'center' }}>{summary.eventsQuantity}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 500 }}>{formatCurrency(summary.subtotal)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}; 
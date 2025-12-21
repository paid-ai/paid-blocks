'use client';

import React, { useEffect, useState } from 'react';
import { useIsInContainer } from './PaidContainer';
import { fetchPaidData } from '../utils/apiClient';
import '../styles/paid-credits-chart.css';

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

interface EntitlementUsage {
    id: string;
    productId: string;
    entitlementId: string;
    creditsCurrencyId: string;
    customerId: string;
    total: string;
    used: string;
    available: string;
    isInfiniteTotal: boolean;
    status: string;
    originCode?: string;
    originDescription?: string;
    startDate: string;
    endDate?: string;
    lastUsedAt?: string;
    creditsCurrency?: {
        name: string;
        key: string;
    };
}

interface CreditBundlesApiResponse {
    success: boolean;
    data: EntitlementUsage[];
}

interface PaidCreditsChartProps {
    customerExternalId: string;
    paidStyle?: PaidStyleProperties;
    showBurnRate?: boolean;
}

export const PaidCreditsChart: React.FC<PaidCreditsChartProps> = ({
    customerExternalId,
    paidStyle = {},
    showBurnRate = true
}) => {
    const [creditBundles, setCreditBundles] = useState<EntitlementUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isInContainer = useIsInContainer();

    // Convert paidStyle entries into CSS custom properties
    const cssVariables: React.CSSProperties = Object.entries(paidStyle).reduce((vars, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
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

    const formatNumber = (value: string | number) => {
        const num = typeof value === 'string' ? parseInt(value, 10) : value;
        return new Intl.NumberFormat('en-US').format(num);
    };

    const calculatePercentage = (used: string, total: string) => {
        const usedNum = parseInt(used, 10);
        const totalNum = parseInt(total, 10);
        if (totalNum === 0) return 0;
        return Math.round((usedNum / totalNum) * 100);
    };

    const calculateBurnRate = (bundle: EntitlementUsage) => {
        if (!bundle.lastUsedAt || !bundle.startDate) return null;

        const start = new Date(bundle.startDate).getTime();
        const lastUsed = new Date(bundle.lastUsedAt).getTime();
        const daysElapsed = (lastUsed - start) / (1000 * 60 * 60 * 24);

        if (daysElapsed <= 0) return null;

        const used = parseInt(bundle.used, 10);
        const burnRatePerDay = used / daysElapsed;

        return Math.round(burnRatePerDay);
    };

    const calculateProjectedDepletion = (bundle: EntitlementUsage) => {
        const burnRate = calculateBurnRate(bundle);
        if (!burnRate || burnRate === 0) return null;

        const available = parseInt(bundle.available, 10);
        const daysRemaining = Math.ceil(available / burnRate);

        if (daysRemaining <= 0) return 'Depleted';

        const depletionDate = new Date();
        depletionDate.setDate(depletionDate.getDate() + daysRemaining);

        return depletionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (percentage: number) => {
        if (percentage >= 80) return '#ef4444'; // red
        if (percentage >= 50) return '#f59e0b'; // orange
        return '#10b981'; // green
    };

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                setLoading(true);

                const response = await fetchPaidData({
                    paidEndpoint: 'credit-bundles',
                    customerExternalId
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json() as CreditBundlesApiResponse;
                // Filter only ACTIVE bundles
                const activeBundles = (data.data || []).filter(bundle => bundle.status === 'ACTIVE');
                setCreditBundles(activeBundles);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchCredits();

        // Listen for cache refresh events
        const handleCacheRefresh = (event: CustomEvent) => {
            if (event.detail?.customerId === customerExternalId || event.detail?.type === 'all') {
                fetchCredits();
            }
        };

        window.addEventListener('cache-refresh', handleCacheRefresh as EventListener);

        return () => {
            window.removeEventListener('cache-refresh', handleCacheRefresh as EventListener);
        };
    }, [customerExternalId]);

    if (loading) {
        return <div className="paid-credits-loading">Loading credit data...</div>;
    }

    if (error) {
        return <div className="paid-credits-error">Error: {error}</div>;
    }

    return (
        <div className="paid-credits-container" style={cssVariables}>
            {!isInContainer && (
                <div className="paid-credits-header">
                    <h3 className="paid-credits-title">Credits Overview</h3>
                </div>
            )}

            {creditBundles.length === 0 ? (
                <div className="paid-credits-empty">
                    <p>No active credit bundles found</p>
                </div>
            ) : (
                <div className="paid-credits-grid">
                    {creditBundles.map((bundle) => {
                        const percentage = calculatePercentage(bundle.used, bundle.total);
                        const statusColor = getStatusColor(percentage);
                        const burnRate = showBurnRate ? calculateBurnRate(bundle) : null;
                        const projectedDepletion = showBurnRate ? calculateProjectedDepletion(bundle) : null;

                        return (
                            <div key={bundle.id} className="paid-credits-card">
                                <div className="paid-credits-card-header">
                                    <h4 className="paid-credits-currency-name">
                                        {bundle.creditsCurrency?.name || 'Credits'}
                                    </h4>
                                    {bundle.originCode && (
                                        <span className="paid-credits-origin-badge">
                                            {bundle.originCode}
                                        </span>
                                    )}
                                </div>

                                <div className="paid-credits-balance">
                                    <div className="paid-credits-balance-main">
                                        <span className="paid-credits-balance-amount">
                                            {bundle.isInfiniteTotal ? '∞' : formatNumber(bundle.available)}
                                        </span>
                                        <span className="paid-credits-balance-label">Available</span>
                                    </div>
                                    {!bundle.isInfiniteTotal && (
                                        <div className="paid-credits-balance-secondary">
                                            <span>{formatNumber(bundle.used)} used</span>
                                            <span>of {formatNumber(bundle.total)} total</span>
                                        </div>
                                    )}
                                </div>

                                {!bundle.isInfiniteTotal && (
                                    <div className="paid-credits-progress-container">
                                        <div className="paid-credits-progress-bar">
                                            <div
                                                className="paid-credits-progress-fill"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: statusColor
                                                }}
                                            />
                                        </div>
                                        <span className="paid-credits-progress-text">
                                            {percentage}% used
                                        </span>
                                    </div>
                                )}

                                {showBurnRate && burnRate && !bundle.isInfiniteTotal && (
                                    <div className="paid-credits-burn-rate">
                                        <div className="paid-credits-stat">
                                            <span className="paid-credits-stat-label">Burn Rate</span>
                                            <span className="paid-credits-stat-value">
                                                {formatNumber(burnRate)}/day
                                            </span>
                                        </div>
                                        {projectedDepletion && (
                                            <div className="paid-credits-stat">
                                                <span className="paid-credits-stat-label">Est. Depletion</span>
                                                <span className="paid-credits-stat-value">
                                                    {projectedDepletion}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="paid-credits-dates">
                                    {bundle.startDate && (
                                        <div className="paid-credits-date">
                                            <span className="paid-credits-date-label">Start:</span>
                                            <span>{new Date(bundle.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {bundle.endDate && (
                                        <div className="paid-credits-date">
                                            <span className="paid-credits-date-label">End:</span>
                                            <span>{new Date(bundle.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

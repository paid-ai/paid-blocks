'use client';

import React, { useEffect, useState } from 'react';
import { useIsInContainer } from './PaidContainer';
import { fetchPaidData } from '../utils/apiClient';
import '../styles/paid-auto-recharge.css';

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

interface AlertRule {
    id: string;
    name: string;
    isActive: boolean;
    scope: string;
    conditionType: string;
    operator?: string;
    threshold?: number;
    unit?: string;
    creditCurrencies: Array<{
        creditsCurrencyId: string;
        creditsCurrency: {
            id: string;
            name: string;
            key: string;
        };
    }>;
}

interface AlertRulesApiResponse {
    success: boolean;
    data: AlertRule[];
}

interface PaidAutoRechargeProps {
    customerExternalId: string;
    paidStyle?: PaidStyleProperties;
    onAlertToggle?: (alertId: string, isActive: boolean) => void;
}

export const PaidAutoRecharge: React.FC<PaidAutoRechargeProps> = ({
    customerExternalId,
    paidStyle = {},
    onAlertToggle
}) => {
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState<string | null>(null);
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

    const formatConditionType = (type: string) => {
        return type.split('_').map(word =>
            word.charAt(0) + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const formatThreshold = (rule: AlertRule) => {
        if (rule.conditionType === 'USAGE_THRESHOLD' && rule.threshold !== undefined) {
            return `${rule.threshold}${rule.unit === 'PERCENTAGE' ? '%' : ' credits'}`;
        }
        if (rule.conditionType === 'INACTIVITY') {
            return `${rule.threshold || 0} days`;
        }
        if (rule.conditionType === 'EXPIRY') {
            return `${rule.threshold || 0} days before expiry`;
        }
        return 'N/A';
    };

    const handleToggle = async (ruleId: string, currentState: boolean) => {
        setToggling(ruleId);
        try {
            // In a real implementation, this would call an API to toggle the alert
            // For now, we'll just update local state and call the callback
            const newState = !currentState;

            setAlertRules(prev =>
                prev.map(rule =>
                    rule.id === ruleId ? { ...rule, isActive: newState } : rule
                )
            );

            if (onAlertToggle) {
                onAlertToggle(ruleId, newState);
            }

            // Dispatch cache refresh event
            window.dispatchEvent(new CustomEvent('cache-refresh', {
                detail: { customerId: customerExternalId, type: 'alerts' }
            }));
        } catch (err) {
            console.error('Failed to toggle alert:', err);
        } finally {
            setToggling(null);
        }
    };

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                setLoading(true);

                const response = await fetchPaidData({
                    paidEndpoint: 'alert-rules',
                    customerExternalId
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json() as AlertRulesApiResponse;
                setAlertRules(data.data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();

        // Listen for cache refresh events
        const handleCacheRefresh = (event: CustomEvent) => {
            if (event.detail?.customerId === customerExternalId || event.detail?.type === 'all') {
                fetchAlerts();
            }
        };

        window.addEventListener('cache-refresh', handleCacheRefresh as EventListener);

        return () => {
            window.removeEventListener('cache-refresh', handleCacheRefresh as EventListener);
        };
    }, [customerExternalId]);

    if (loading) {
        return <div className="paid-auto-recharge-loading">Loading alert settings...</div>;
    }

    if (error) {
        return <div className="paid-auto-recharge-error">Error: {error}</div>;
    }

    return (
        <div className="paid-auto-recharge-container" style={cssVariables}>
            {!isInContainer && (
                <div className="paid-auto-recharge-header">
                    <h3 className="paid-auto-recharge-title">Credit Alerts & Auto-Recharge</h3>
                    <p className="paid-auto-recharge-subtitle">
                        Manage automatic notifications for credit usage, inactivity, and expiration
                    </p>
                </div>
            )}

            {alertRules.length === 0 ? (
                <div className="paid-auto-recharge-empty">
                    <div className="paid-auto-recharge-empty-icon">🔔</div>
                    <h4>No Alert Rules Configured</h4>
                    <p>Contact your administrator to set up credit alerts and auto-recharge settings.</p>
                </div>
            ) : (
                <div className="paid-auto-recharge-list">
                    {alertRules.map((rule) => (
                        <div key={rule.id} className="paid-auto-recharge-card">
                            <div className="paid-auto-recharge-card-header">
                                <div className="paid-auto-recharge-card-info">
                                    <h4 className="paid-auto-recharge-rule-name">{rule.name}</h4>
                                    <div className="paid-auto-recharge-rule-meta">
                                        <span className="paid-auto-recharge-condition-type">
                                            {formatConditionType(rule.conditionType)}
                                        </span>
                                        <span className="paid-auto-recharge-threshold">
                                            Threshold: {formatThreshold(rule)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className={`paid-auto-recharge-toggle ${rule.isActive ? 'active' : ''}`}
                                    onClick={() => handleToggle(rule.id, rule.isActive)}
                                    disabled={toggling === rule.id}
                                    aria-label={`Toggle ${rule.name}`}
                                >
                                    <div className="paid-auto-recharge-toggle-track">
                                        <div className="paid-auto-recharge-toggle-thumb" />
                                    </div>
                                </button>
                            </div>

                            <div className="paid-auto-recharge-card-body">
                                {rule.creditCurrencies.length > 0 && (
                                    <div className="paid-auto-recharge-currencies">
                                        <span className="paid-auto-recharge-currencies-label">
                                            Monitoring:
                                        </span>
                                        <div className="paid-auto-recharge-currencies-list">
                                            {rule.creditCurrencies.map((cc) => (
                                                <span
                                                    key={cc.creditsCurrencyId}
                                                    className="paid-auto-recharge-currency-badge"
                                                >
                                                    {cc.creditsCurrency.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="paid-auto-recharge-status">
                                    <span className={`paid-auto-recharge-status-badge ${rule.isActive ? 'active' : 'inactive'}`}>
                                        {rule.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="paid-auto-recharge-scope-badge">
                                        {rule.scope}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="paid-auto-recharge-info">
                <div className="paid-auto-recharge-info-icon">ℹ️</div>
                <div className="paid-auto-recharge-info-content">
                    <strong>About Alert Rules:</strong> These alerts will notify you via email when credit
                    thresholds are reached, usage becomes inactive, or credits are nearing expiration.
                    Toggle alerts on/off to control notifications.
                </div>
            </div>
        </div>
    );
};

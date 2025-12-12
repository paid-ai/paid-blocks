'use client';

import React, { useEffect, useState } from 'react';
import { useIsInContainer } from './PaidContainer';
import { fetchPaidData } from '../utils/apiClient';
import '../styles/paid-plan-recommendation.css';

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
    total: string;
    used: string;
    available: string;
    isInfiniteTotal: boolean;
    status: string;
    lastUsedAt?: string;
    startDate: string;
    creditsCurrency?: {
        name: string;
        key: string;
    };
}

interface Plan {
    id: string;
    name: string;
    description?: string;
    nextPlanId?: string;
    prevPlanId?: string;
}

interface PlanGroup {
    id: string;
    name: string;
    description?: string;
    plans: Plan[];
}

interface PlanRecommendation {
    shouldUpgrade: boolean;
    currentPlan?: Plan;
    recommendedPlan?: Plan;
    reasoning: string[];
    usagePercentage: number;
    burnRate?: number;
}

interface PaidPlanRecommendationProps {
    customerExternalId: string;
    paidStyle?: PaidStyleProperties;
    thresholdPercentage?: number;
    onUpgradeClick?: (planId: string, planName: string) => void;
}

export const PaidPlanRecommendation: React.FC<PaidPlanRecommendationProps> = ({
    customerExternalId,
    paidStyle = {},
    thresholdPercentage = 80,
    onUpgradeClick
}) => {
    const [recommendation, setRecommendation] = useState<PlanRecommendation | null>(null);
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

    const calculateBurnRate = (bundle: EntitlementUsage) => {
        if (!bundle.lastUsedAt || !bundle.startDate) return null;

        const start = new Date(bundle.startDate).getTime();
        const lastUsed = new Date(bundle.lastUsedAt).getTime();
        const daysElapsed = (lastUsed - start) / (1000 * 60 * 60 * 24);

        if (daysElapsed <= 0) return null;

        const used = parseInt(bundle.used, 10);
        return Math.round(used / daysElapsed);
    };

    const analyzeRecommendation = (
        creditBundles: EntitlementUsage[],
        planGroups: PlanGroup[]
    ): PlanRecommendation => {
        // Filter active bundles
        const activeBundles = creditBundles.filter(b => b.status === 'ACTIVE' && !b.isInfiniteTotal);

        if (activeBundles.length === 0) {
            return {
                shouldUpgrade: false,
                reasoning: ['No active credit bundles found'],
                usagePercentage: 0
            };
        }

        // Calculate average usage percentage across all bundles
        const usagePercentages = activeBundles.map(bundle => {
            const used = parseInt(bundle.used, 10);
            const total = parseInt(bundle.total, 10);
            return (used / total) * 100;
        });

        const avgUsagePercentage = Math.round(
            usagePercentages.reduce((sum, p) => sum + p, 0) / usagePercentages.length
        );

        // Calculate burn rates
        const burnRates = activeBundles
            .map(calculateBurnRate)
            .filter((rate): rate is number => rate !== null);

        const avgBurnRate = burnRates.length > 0
            ? Math.round(burnRates.reduce((sum, rate) => sum + rate, 0) / burnRates.length)
            : undefined;

        // Check if upgrade is needed
        if (avgUsagePercentage < thresholdPercentage) {
            return {
                shouldUpgrade: false,
                reasoning: [`Current usage is at ${avgUsagePercentage}%, below the ${thresholdPercentage}% threshold`],
                usagePercentage: avgUsagePercentage,
                burnRate: avgBurnRate
            };
        }

        // Find recommended plan (for now, just suggest that an upgrade might be beneficial)
        // In a real implementation, you would analyze plan details and find the best fit
        const reasoning: string[] = [
            `You're using ${avgUsagePercentage}% of your current credits`,
            `This exceeds the recommended ${thresholdPercentage}% threshold`,
        ];

        if (avgBurnRate) {
            reasoning.push(`Your average burn rate is ${avgBurnRate} credits per day`);
        }

        const totalAvailable = activeBundles.reduce((sum, b) => sum + parseInt(b.available, 10), 0);
        if (avgBurnRate && totalAvailable > 0) {
            const daysRemaining = Math.ceil(totalAvailable / avgBurnRate);
            reasoning.push(`At current usage, credits may be depleted in ~${daysRemaining} days`);
        }

        reasoning.push('Consider upgrading to a higher tier plan for better value and more credits');

        return {
            shouldUpgrade: true,
            reasoning,
            usagePercentage: avgUsagePercentage,
            burnRate: avgBurnRate
        };
    };

    useEffect(() => {
        const fetchAndAnalyze = async () => {
            try {
                setLoading(true);

                // Fetch credit bundles and plan groups in parallel
                const [creditResponse, planResponse] = await Promise.all([
                    fetchPaidData({
                        paidEndpoint: 'credit-bundles',
                        customerExternalId
                    }),
                    fetchPaidData({
                        paidEndpoint: 'plan-groups',
                        customerExternalId
                    })
                ]);

                if (!creditResponse.ok || !planResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const creditData = await creditResponse.json();
                const planData = await planResponse.json();

                // Analyze and generate recommendation
                const analysis = analyzeRecommendation(
                    creditData.data || [],
                    planData.data || []
                );

                setRecommendation(analysis);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchAndAnalyze();

        // Listen for cache refresh events
        const handleCacheRefresh = (event: CustomEvent) => {
            if (event.detail?.customerId === customerExternalId || event.detail?.type === 'all') {
                fetchAndAnalyze();
            }
        };

        window.addEventListener('cache-refresh', handleCacheRefresh as EventListener);

        return () => {
            window.removeEventListener('cache-refresh', handleCacheRefresh as EventListener);
        };
    }, [customerExternalId, thresholdPercentage]);

    if (loading) {
        return <div className="paid-plan-recommendation-loading">Analyzing your usage...</div>;
    }

    if (error) {
        return <div className="paid-plan-recommendation-error">Error: {error}</div>;
    }

    if (!recommendation?.shouldUpgrade) {
        return (
            <div className="paid-plan-recommendation-container" style={cssVariables}>
                {!isInContainer && (
                    <div className="paid-plan-recommendation-header">
                        <h3 className="paid-plan-recommendation-title">Plan Recommendations</h3>
                    </div>
                )}
                <div className="paid-plan-recommendation-no-upgrade">
                    <div className="paid-plan-recommendation-no-upgrade-icon">✓</div>
                    <h4>You're All Set!</h4>
                    <p>Your current plan suits your usage patterns well.</p>
                    {recommendation && (
                        <div className="paid-plan-recommendation-usage-badge">
                            {recommendation.usagePercentage}% of credits used
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="paid-plan-recommendation-container" style={cssVariables}>
            {!isInContainer && (
                <div className="paid-plan-recommendation-header">
                    <h3 className="paid-plan-recommendation-title">Plan Recommendations</h3>
                </div>
            )}

            <div className="paid-plan-recommendation-card">
                <div className="paid-plan-recommendation-badge">
                    <span>⚡</span> Recommended
                </div>

                <div className="paid-plan-recommendation-content">
                    <h4 className="paid-plan-recommendation-heading">
                        Consider Upgrading Your Plan
                    </h4>

                    <div className="paid-plan-recommendation-usage">
                        <div className="paid-plan-recommendation-usage-bar">
                            <div
                                className="paid-plan-recommendation-usage-fill"
                                style={{
                                    width: `${Math.min(recommendation.usagePercentage, 100)}%`,
                                    backgroundColor: recommendation.usagePercentage >= 90 ? '#ef4444' : '#f59e0b'
                                }}
                            />
                        </div>
                        <span className="paid-plan-recommendation-usage-text">
                            {recommendation.usagePercentage}% of credits used
                        </span>
                    </div>

                    <div className="paid-plan-recommendation-reasons">
                        <h5>Why upgrade?</h5>
                        <ul>
                            {recommendation.reasoning.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                            ))}
                        </ul>
                    </div>

                    {recommendation.burnRate && (
                        <div className="paid-plan-recommendation-burn-rate">
                            <span className="paid-plan-recommendation-burn-rate-label">
                                Daily Burn Rate:
                            </span>
                            <span className="paid-plan-recommendation-burn-rate-value">
                                {recommendation.burnRate.toLocaleString()} credits/day
                            </span>
                        </div>
                    )}

                    <button
                        className="paid-plan-recommendation-cta"
                        onClick={() => {
                            if (onUpgradeClick && recommendation.recommendedPlan) {
                                onUpgradeClick(
                                    recommendation.recommendedPlan.id,
                                    recommendation.recommendedPlan.name
                                );
                            }
                        }}
                    >
                        Contact Sales to Upgrade
                    </button>

                    <p className="paid-plan-recommendation-note">
                        Contact your account manager or sales team to discuss plan options
                        that better fit your usage patterns.
                    </p>
                </div>
            </div>
        </div>
    );
};

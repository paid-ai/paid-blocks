'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import '../styles/activity-log-table.css';
export const PaidActivityLog = ({ accountExternalId, host }) => {
    const [usageSummaries, setUsageSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount / 100);
    };
    const formatEventName = (eventName) => {
        return eventName
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };
    const formatDate = (dateString) => {
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
                const mappedUsageSummaries = (data.data.usageSummary || []).map((summary) => ({
                    ...summary,
                    accountId: summary.customerId,
                }));
                setUsageSummaries(mappedUsageSummaries);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
            finally {
                setLoading(false);
            }
        };
        fetchUsageData();
    }, [accountExternalId]);
    const displayedSummaries = showAll ? usageSummaries : usageSummaries.slice(0, 4);
    const hasMoreSummaries = usageSummaries.length > 4;
    if (loading) {
        return _jsx("div", { children: "Loading usage data..." });
    }
    if (error) {
        return _jsxs("div", { children: ["Error: ", error] });
    }
    return (_jsx("div", { className: "paid-activity-log-container", style: { position: 'relative', minWidth: 0 }, children: _jsxs("div", { className: "paid-activity-log-table-wrapper", style: { position: 'static', width: '100%', height: 'auto', left: undefined, top: undefined, boxShadow: undefined, cursor: undefined }, children: [_jsxs("div", { className: "paid-activity-log-header", children: [_jsx("h3", { className: "paid-activity-log-title", children: "Paid.ai Activity Log" }), hasMoreSummaries && (_jsx("button", { onClick: () => setShowAll(!showAll), className: "paid-activity-log-toggle-btn", children: showAll ? 'Show less' : 'Show all usage' }))] }), _jsx("div", { style: { background: '#fff', overflow: 'auto' }, children: _jsxs("table", { className: "paid-activity-log-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Event" }), _jsx("th", { children: "Start Date" }), _jsx("th", { children: "End Date" }), _jsx("th", { style: { textAlign: 'center' }, children: "Current Usage" }), _jsx("th", { style: { textAlign: 'center' }, children: "Total" })] }) }), _jsx("tbody", { children: displayedSummaries.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "paid-activity-log-empty", children: "No usage data found" }) })) : (displayedSummaries.map((summary) => (_jsxs("tr", { children: [_jsx("td", { style: { fontWeight: 500 }, children: formatEventName(summary.eventName) }), _jsx("td", { children: formatDate(summary.startDate) }), _jsx("td", { children: formatDate(summary.endDate) }), _jsx("td", { style: { textAlign: 'center' }, children: summary.eventsQuantity }), _jsx("td", { style: { textAlign: 'center', fontWeight: 500 }, children: formatCurrency(summary.subtotal) })] }, summary.id)))) })] }) })] }) }));
};
//# sourceMappingURL=PaidActivityLog.js.map
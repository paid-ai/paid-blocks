'use client';

import React, { useEffect, useState } from 'react';
import { useIsInContainer } from './PaidContainer';
import { getCacheKey, CACHE_TTL, dataCache } from '../utils/cache';
import { Pagination } from './ui/Pagination';
import { fetchPaidData, PaidBlocksOptions } from '../utils/apiClient';
import '../styles/paid-invoice-table.css';

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

interface Invoice {
    id: string;
    number: string;
    issueDate: string;
    dueDate: string;
    paymentStatus: string;
    invoiceTotal: number;
    currency: string;
    customer?: {
        id: string;
        name: string;
        externalId: string;
    };
}

interface InvoiceApiResponse {
    data: Invoice[];
}

interface PaidInvoiceTableProps {
    customerExternalId: string;
    paidStyle?: PaidStyleProperties;
    options?: PaidBlocksOptions;
}

export const PaidInvoiceTable: React.FC<PaidInvoiceTableProps> = ({
    customerExternalId,
    paidStyle = {},
    options
}) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [pdfResponse, setPdfResponse] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const isInContainer = useIsInContainer();

    // Calculate pagination
    const totalPages = Math.ceil(invoices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentInvoices = invoices.slice(startIndex, endIndex);

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
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusClass = `paid-invoice-status paid-invoice-status-${status.toLowerCase()}`;
        const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        return <span className={statusClass}>{displayStatus}</span>;
    };

    const handlePreview = async (invoice: Invoice) => {
        try {
            setLoadingInvoiceId(invoice.id);
            setSelectedInvoice(invoice);
            
            // Check cache first for PDF
            const pdfCacheKey = getCacheKey.invoicePdf(invoice.id);
            const cachedPdf = dataCache.get<string>(pdfCacheKey);
            
            if (cachedPdf) {
                setPdfResponse(cachedPdf);
                setIsPreviewOpen(true);
                setLoadingInvoiceId(null);
                return;
            }
            
            // Fetch PDF if not cached using new API client
            const response = await fetchPaidData({
                paidEndpoint: 'invoice-pdf',
                invoiceId: invoice.id,
                options
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch PDF');
            }
            
            const data = await response.json();
            const pdfData = "data:application/pdf;base64," + data.data.pdfBytes;
            
            // Cache the PDF data
            dataCache.set(pdfCacheKey, pdfData, CACHE_TTL.PDF);
            
            setPdfResponse(pdfData);
            setIsPreviewOpen(true);
        } catch (error) {
            console.error('Error fetching PDF:', error);
            alert('Failed to load PDF preview');
        } finally {
            setLoadingInvoiceId(null);
        }
    };

    const handleDownload = () => {
        if (!pdfResponse || !selectedInvoice) return;

        const base64WithoutPrefix = pdfResponse.split(",")[1];
        const byteCharacters = atob(base64WithoutPrefix);
        const byteNumbers = new Array(byteCharacters.length)
            .fill(0)
            .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${selectedInvoice.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        const fetchInvoiceData = async () => {
            try {
                setLoading(true);
                
                // Use new API client for invoice data
                const response = await fetchPaidData({
                    paidEndpoint: 'invoices',
                    customerExternalId,
                    options
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json() as InvoiceApiResponse;
                setInvoices(data.data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoiceData();

        // Listen for cache refresh events
        const handleCacheRefresh = (event: CustomEvent) => {
            if (event.detail?.customerId === customerExternalId || event.detail?.type === 'all') {
                fetchInvoiceData();
            }
        };

        window.addEventListener('cache-refresh', handleCacheRefresh as EventListener);

        return () => {
            window.removeEventListener('cache-refresh', handleCacheRefresh as EventListener);
        };
    }, [customerExternalId]);

    if (loading) {
        return <div>Loading invoice data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <>
            <div className="paid-invoice-container" style={{ ...cssVariables }}>
                <div className="paid-invoice-table-wrapper">
                    {!isInContainer && (
                        <div className="paid-invoice-header">
                            <h3 className="paid-invoice-title">Invoices</h3>
                        </div>
                    )}
                    <div style={{ background: '#fff', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
                        <table className="paid-invoice-table" style={{ width: '100%', maxWidth: '100%', tableLayout: 'fixed' }}>
                            <thead>
                                <tr>
                                    <th>Invoice Number</th>
                                    <th>Status</th>
                                    <th>Invoice Date</th>
                                    <th>Due Date</th>
                                    <th style={{ textAlign: 'right' }}>Total amount</th>
                                    <th style={{ textAlign: 'center' }}>Preview</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="paid-invoice-empty">
                                            No invoices found
                                        </td>
                                    </tr>
                                ) : (
                                    currentInvoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td style={{ fontWeight: 500 }}>INV-{invoice.number}</td>
                                            <td>{getStatusBadge(invoice.paymentStatus)}</td>
                                            <td>{formatDate(invoice.issueDate)}</td>
                                            <td>{formatDate(invoice.dueDate)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(invoice.invoiceTotal, invoice.currency)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className="paid-invoice-action-btn"
                                                    onClick={() => handlePreview(invoice)}
                                                    disabled={loadingInvoiceId === invoice.id}
                                                    title="Preview Invoice"
                                                >
                                                    {loadingInvoiceId === invoice.id ? (
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="37.7" strokeDashoffset="37.7">
                                                                <animateTransform attributeName="transform" type="rotate" values="0 8 8;360 8 8" dur="1s" repeatCount="indefinite"/>
                                                            </circle>
                                                        </svg>
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                            <path d="M2 2h8l4 4v8a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                                            <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                                            <path d="M5 9h6M5 11h4" stroke="currentColor" strokeWidth="1.5"/>
                                                        </svg>
                                                    )}
                                                </button>
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

            {/* PDF Preview Modal */}
            {isPreviewOpen && (
                <div className="paid-invoice-modal-overlay" onClick={() => setIsPreviewOpen(false)}>
                    <div className="paid-invoice-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="paid-invoice-modal-body">
                            {pdfResponse ? (
                                <iframe
                                    src={pdfResponse}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                    title="Invoice PDF"
                                />
                            ) : (
                                <div className="paid-invoice-modal-loading">Loading PDF...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}; 
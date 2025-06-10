import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className = ''
}) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            if (currentPage > 3) {
                pages.push('...');
            }
            
            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            
            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                    pages.push(i);
                }
            }
            
            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            
            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <>
            <style>{`
                .paid-pagination-btn {
                    padding: 6px 12px;
                    border: 1px solid #E5E7EB;
                    background-color: var(--paid-button-bg-color, #FFFFFF) !important;
                    color: var(--paid-primary-color, #374151) !important;
                    border-radius: 6px;
                    cursor: pointer;
                    fontSize: 13px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    outline: none !important;
                    user-select: none;
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    appearance: none !important;
                    box-shadow: none !important;
                }
                
                .paid-pagination-btn:hover:not(:disabled) {
                    filter: brightness(0.9) !important;
                    transform: translateY(-1px) !important;
                    background-color: var(--paid-button-bg-color, #FFFFFF) !important;
                }
                
                .paid-pagination-btn:active:not(:disabled) {
                    filter: brightness(0.8) !important;
                    transform: translateY(0px) !important;
                    background-color: var(--paid-button-bg-color, #FFFFFF) !important;
                }
                
                .paid-pagination-btn:focus:not(:disabled) {
                    filter: brightness(0.9) !important;
                    background-color: var(--paid-button-bg-color, #FFFFFF) !important;
                    box-shadow: none !important;
                    outline: none !important;
                }
                
                .paid-pagination-btn:disabled {
                    background-color: var(--paid-button-bg-color, #F9FAFB) !important;
                    color: #9CA3AF !important;
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                
                .paid-pagination-btn.current-page {
                    background-color: #F3F4F6 !important;
                    color: var(--paid-primary-color, #111827) !important;
                    font-weight: 600;
                }
                
                .paid-pagination-btn.page-number {
                    padding: 6px 10px;
                    min-width: 32px;
                }
            `}</style>
            <div className={`pagination-container ${className}`} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '6px',
                padding: '16px 24px',
                fontSize: '13px',
                fontFamily: 'inherit',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="paid-pagination-btn"
                >
                    Previous
                </button>

                {visiblePages.map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span style={{
                                padding: '6px 4px',
                                color: '#9CA3AF',
                                fontSize: '13px'
                            }}>
                                ...
                            </span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page as number)}
                                className={`paid-pagination-btn page-number ${currentPage === page ? 'current-page' : ''}`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="paid-pagination-btn"
                >
                    Next
                </button>
            </div>
        </>
    );
}; 
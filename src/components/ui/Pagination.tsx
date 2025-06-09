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
                style={{
                    padding: '6px 12px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: currentPage === 1 ? '#F9FAFB' : '#FFFFFF',
                    color: currentPage === 1 ? '#9CA3AF' : '#374151',
                    borderRadius: '6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                    userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                    }
                }}
                onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                    }
                }}
                onMouseDown={(e) => {
                    if (currentPage !== 1) {
                        e.currentTarget.style.backgroundColor = '#E5E7EB';
                    }
                }}
                onMouseUp={(e) => {
                    if (currentPage !== 1) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }
                }}
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
                            style={{
                                padding: '6px 10px',
                                border: '1px solid #E5E7EB',
                                backgroundColor: currentPage === page ? '#F3F4F6' : '#FFFFFF',
                                color: currentPage === page ? '#111827' : '#374151',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: currentPage === page ? '600' : '500',
                                minWidth: '32px',
                                transition: 'all 0.15s ease',
                                outline: 'none',
                                userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                } else {
                                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                                }
                            }}
                            onMouseDown={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.backgroundColor = '#E5E7EB';
                                }
                            }}
                            onMouseUp={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                                } else {
                                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                                }
                            }}
                        >
                            {page}
                        </button>
                    )}
                </React.Fragment>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    padding: '6px 12px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: currentPage === totalPages ? '#F9FAFB' : '#FFFFFF',
                    color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                    borderRadius: '6px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                    userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                    if (currentPage !== totalPages) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                    }
                }}
                onMouseLeave={(e) => {
                    if (currentPage !== totalPages) {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                    }
                }}
                onMouseDown={(e) => {
                    if (currentPage !== totalPages) {
                        e.currentTarget.style.backgroundColor = '#E5E7EB';
                    }
                }}
                onMouseUp={(e) => {
                    if (currentPage !== totalPages) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }
                }}
            >
                Next
            </button>
        </div>
    );
}; 
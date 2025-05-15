'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

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
}

export const PaidActivityLog: React.FC<PaidActivityLogProps> = ({ accountExternalId, host }) => {
    const [usageSummaries, setUsageSummaries] = useState<UsageSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [tableSize, setTableSize] = useState({ width: '70%', height: 'auto' });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const tableRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const resizeDirection = useRef<string>('');
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });
    const startPosition = useRef({ x: 0, y: 0 });

    const handleDragStart = (e: React.MouseEvent) => {
        if (!tableRef.current) return;
        isDragging.current = true;
        startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        if (!tableRef.current) return;
        isResizing.current = true;
        resizeDirection.current = direction;
        startPos.current = { x: e.clientX, y: e.clientY };
        startSize.current = {
            width: tableRef.current.offsetWidth,
            height: tableRef.current.offsetHeight
        };
        startPosition.current = { x: position.x, y: position.y };
        e.stopPropagation();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
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
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current && tableRef.current) {
                const newX = e.clientX - startPos.current.x;
                const newY = e.clientY - startPos.current.y;
                setPosition({ x: newX, y: newY });
            }
            
            if (isResizing.current && tableRef.current) {
                const deltaX = e.clientX - startPos.current.x;
                const deltaY = e.clientY - startPos.current.y;
                
                let newWidth = startSize.current.width;
                let newHeight = startSize.current.height;
                let newX = startPosition.current.x;
                let newY = startPosition.current.y;

                // Handle width changes
                if (resizeDirection.current.includes('e')) {
                    newWidth = Math.max(300, startSize.current.width + deltaX);
                }
                if (resizeDirection.current.includes('w')) {
                    const widthChange = Math.min(startSize.current.width - 300, deltaX);
                    newWidth = startSize.current.width - widthChange;
                    newX = startPosition.current.x + widthChange;
                }

                // Handle height changes
                if (resizeDirection.current.includes('s')) {
                    newHeight = Math.max(200, startSize.current.height + deltaY);
                }
                if (resizeDirection.current.includes('n')) {
                    const heightChange = Math.min(startSize.current.height - 200, deltaY);
                    newHeight = startSize.current.height - heightChange;
                    newY = startPosition.current.y + heightChange;
                }

                // Update both position and size atomically
                setPosition({ x: newX, y: newY });
                setTableSize({
                    width: `${newWidth}px`,
                    height: `${newHeight}px`
                });
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            isResizing.current = false;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

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
        <div className="relative min-w-[600px]">
            <div 
                ref={tableRef}
                className="absolute border rounded-lg overflow-auto bg-white shadow-lg"
                style={{ 
                    width: tableSize.width, 
                    height: tableSize.height,
                    left: position.x,
                    top: position.y,
                    cursor: isDragging.current ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleDragStart}
            >
                {/* Resize handles */}
                <div 
                    className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
                    onMouseDown={(e) => handleResizeStart(e, 'nw')}
                >
                    <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-gray-400" />
                </div>
                <div 
                    className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
                    onMouseDown={(e) => handleResizeStart(e, 'ne')}
                >
                    <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-gray-400" />
                </div>
                <div 
                    className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
                    onMouseDown={(e) => handleResizeStart(e, 'sw')}
                >
                    <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-gray-400" />
                </div>
                <div 
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                >
                    <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-gray-400" />
                </div>
                <div 
                    className="absolute top-0 left-4 right-4 h-4 cursor-n-resize"
                    onMouseDown={(e) => handleResizeStart(e, 'n')}
                />
                <div 
                    className="absolute bottom-0 left-4 right-4 h-4 cursor-s-resize"
                    onMouseDown={(e) => handleResizeStart(e, 's')}
                />
                <div 
                    className="absolute left-0 top-4 bottom-4 w-4 cursor-w-resize"
                    onMouseDown={(e) => handleResizeStart(e, 'w')}
                />
                <div 
                    className="absolute right-0 top-4 bottom-4 w-4 cursor-e-resize"
                    onMouseDown={(e) => handleResizeStart(e, 'e')}
                />

                <div className="flex justify-between items-center p-4 bg-white border-b">
                    <h3 className="text-md font-semibold">Paid.ai Activity Log</h3>
                    {hasMoreSummaries && (
                        <button 
                            onClick={() => setShowAll(!showAll)}
                            className="flex items-center text-sm font-medium text-primary hover:underline cursor-pointer"
                        >
                            {showAll ? 'Show less' : 'Show all usage'}
                        </button>
                    )}
                </div>
                <div className="overflow-auto bg-white" style={{ height: 'calc(100% - 50px)' }}>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="border-b hover:bg-transparent">
                                <TableHead className="w-[30%] font-medium text-muted-foreground py-4 pl-6">Event</TableHead>
                                <TableHead className="w-[17.5%] text-right font-medium text-muted-foreground py-4 pr-6">Start Date</TableHead>
                                <TableHead className="w-[17.5%] text-right font-medium text-muted-foreground py-4 pr-6">End Date</TableHead>
                                <TableHead className="w-[17.5%] text-right font-medium text-muted-foreground py-4 pr-6">Current Usage</TableHead>
                                <TableHead className="w-[17.5%] text-right font-medium text-muted-foreground py-4 pr-6">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedSummaries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        No usage data found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedSummaries.map((summary) => (
                                    <TableRow key={summary.id} className="hover:bg-gray-100 text-[13px] border-b transition-colors">
                                        <TableCell className="font-medium py-4 pl-6">{formatEventName(summary.eventName)}</TableCell>
                                        <TableCell className="text-right py-4 pr-6">{formatDate(summary.startDate)}</TableCell>
                                        <TableCell className="text-right py-4 pr-6">{formatDate(summary.endDate)}</TableCell>
                                        <TableCell className="text-right py-4 pr-6">{summary.eventsQuantity}</TableCell>
                                        <TableCell className="text-right font-medium py-4 pr-6">{formatCurrency(summary.subtotal)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}; 
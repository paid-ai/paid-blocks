'use client';

import React, { useState, createContext, useContext } from 'react';
import '../styles/paid-container.css';

// Create context to detect if components are inside a container
const PaidContainerContext = createContext<boolean>(false);

// Export hook for components to use
export const useIsInContainer = () => useContext(PaidContainerContext);

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

interface PaidContainerTab {
    id: string;
    label: string;
    component: React.ReactNode;
}

interface PaidContainerProps {
    title: string;
    description?: string;
    tabs?: PaidContainerTab[];
    defaultActiveTab?: string;
    paidStyle?: PaidStyleProperties;
    children?: React.ReactNode;
}

export const PaidContainer: React.FC<PaidContainerProps> = ({ 
    title, 
    description, 
    tabs = [], 
    defaultActiveTab,
    paidStyle = {},
    children
}) => {
    const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.id);

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

    const activeTabData = tabs.find(tab => tab.id === activeTab);

    return (
        <PaidContainerContext.Provider value={true}>
            <div className="paid-container" style={{ ...cssVariables }}>
                <div className="paid-container-wrapper">
                    <div className="paid-container-header">
                        <div className="paid-container-header-content">
                            <h2 className="paid-container-title">{title}</h2>
                            {description && (
                                <p className="paid-container-description">{description}</p>
                            )}
                        </div>
                        
                        {tabs.length > 1 && (
                            <div className="paid-container-tabs">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`paid-container-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="paid-container-content">
                        {children || activeTabData?.component}
                    </div>
                </div>
            </div>
        </PaidContainerContext.Provider>
    );
}; 
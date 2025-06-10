'use client';

import React, { useState, createContext, useContext } from 'react';
import '../styles/paid-container.css';

// Create context to detect if components are inside a container
const PaidContainerContext = createContext<boolean>(false);

// Export hook for components to use
export const useIsInContainer = () => useContext(PaidContainerContext);

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
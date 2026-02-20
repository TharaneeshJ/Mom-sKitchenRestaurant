import React, { type ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Receipt, Settings, ChefHat, Menu, X } from 'lucide-react';
import { RESTAURANT_SETTINGS } from '../../config/constants';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="dashboard-container">
            {/* Mobile Header */}
            <div className="mobile-header">
                <div className="mobile-logo">
                    <span>{RESTAURANT_SETTINGS.NAME}</span>
                </div>
                <button className="menu-toggle" onClick={toggleSidebar}>
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Backdrop */}
            {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar}></div>}

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-content">
                            <h1 className="sidebar-title">{RESTAURANT_SETTINGS.NAME}</h1>
                            <p className="sidebar-subtitle">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/kitchen"
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <ChefHat size={18} />
                        Kitchen Dashboard
                    </NavLink>

                    <NavLink
                        to="/billing"
                        onClick={closeSidebar}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <Receipt size={18} />
                        Billing & Orders
                    </NavLink>

                    <div className="nav-divider">
                        <NavLink
                            to="/settings"
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <Settings size={18} />
                            Settings
                        </NavLink>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            M
                        </div>
                        <div className="user-info">
                            <p className="user-name">Manager</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

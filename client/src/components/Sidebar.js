import React from 'react';
import './Navigation.css';

const Sidebar = ({ isOpen, onClose, user, setView, handleLogout }) => {

    const handleLinkClick = (viewName) => {
        setView(viewName);
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            ></div>

            {/* Sidebar Drawer */}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                        תפריט
                    </h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="nav-links">
                    <div className="sidebar-user-profile">
                        <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-role">{user.role === 'Service Provider' ? 'ספק שירות' : 'לקוח'}</div>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button className="nav-link" onClick={() => handleLinkClick('home')}>
                            דף הבית
                        </button>

                        <button className="nav-link" onClick={() => handleLinkClick('businesses')}>
                            רשימת עסקים
                        </button>

                        <button className="nav-link" onClick={() => handleLinkClick('my-appointments')}>
                            התורים שלי
                        </button>

                        {user.role === 'Service Provider' && (
                            <button className="nav-link" onClick={() => handleLinkClick('business-setup')}>
                                הגדרת עסק
                            </button>
                        )}
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <button
                        className="nav-link logout-link"
                        onClick={() => { handleLogout(); onClose(); }}
                    >
                        יציאה
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;

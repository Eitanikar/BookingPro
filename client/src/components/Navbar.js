import React from 'react';
import './Navigation.css';

// [1] הוספנו את onMyBusinessClick
const Navbar = ({ toggleSidebar, user, setView, onMyBusinessClick }) => {
    return (
        <nav className="navbar">
            <div className="flex items-center gap-4">
                {/* Hamburger / Menu Trigger */}
                {user && (
                    <button className="menu-trigger" onClick={toggleSidebar} title="פתח תפריט">
                        <span className="menu-line"></span>
                        <span className="menu-line"></span>
                        <span className="menu-line"></span>
                    </button>
                )}

                <span
                    className="navbar-brand"
                    onClick={() => setView('home')}
                    style={{ cursor: 'pointer' }}
                >
                    BookingPro
                </span>
            </div>

            {/* Optional: Right side content */}
            {user && (
                <div className="d-flex align-items-center gap-3">
                    {/* [2] כפתור קיצור דרך לספקים (רק במחשב) */}
                    {user.role === 'Service Provider' && (
                        <button 
                            className="d-none d-md-block"
                            onClick={onMyBusinessClick}
                            style={{ 
                                background: 'transparent', 
                                border: '1px solid rgba(255,255,255,0.3)', 
                                color: 'white', 
                                padding: '5px 10px', 
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                marginLeft: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            🏠 העסק שלי
                        </button>
                    )}

                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }} className="d-none d-md-block">
                        שלום, <strong>{user.name.split(' ')[0]}</strong>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
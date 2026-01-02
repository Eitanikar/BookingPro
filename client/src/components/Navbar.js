import React from 'react';
import './Navigation.css';

const Navbar = ({ toggleSidebar, user, setView }) => {
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
                >
                    BookingPro
                </span>
            </div>

            {/* Optional: Right side content (e.g., user avatar or simple text) */}
            {user && (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }} className="d-none d-md-block">
                    שלום, <strong>{user.name.split(' ')[0]}</strong>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

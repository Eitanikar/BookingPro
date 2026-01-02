import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import MyAppointments from './components/MyAppointments';
import BusinessProfileSetup from './components/BusinessProfileSetup';
import BusinessesList from './components/BusinessesList'; // <--- [1] הוספה חדשה
import BusinessProfileClientView from './components/BusinessProfileClientView'; // <--- [NEW]
import BookingDateSelection from './components/BookingDateSelection'; // <--- [NEW]
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [resetToken, setResetToken] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for Sidebar

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // States for Booking Flow
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  // בדיקת URL כדי לזהות כניסה מקישור לאיפוס סיסמה
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/reset-password/')) {
      const token = path.split('/')[2];
      if (token) {
        setResetToken(token);
        setView('reset-password');
      }
    }

    // האזנה לאירוע מעבר לדף "שכחתי סיסמה" מתוך הקומפוננטה Login
    const handleSwitchView = (e) => setView(e.detail);
    window.addEventListener('switchView', handleSwitchView);
    return () => window.removeEventListener('switchView', handleSwitchView);

  }, []);

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    setView('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setView('home');
  };

  return (
    <div className={`App ${isSidebarOpen ? 'sidebar-open' : ''}`}>

      {/* --- Header / Navbar --- */}
      {/* --- Header / Navbar (NEW) --- */}
      <Navbar
        user={user}
        toggleSidebar={toggleSidebar}
        setView={setView}
      />

      {/* --- Sidebar (NEW) --- */}
      {user && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
          setView={setView}
          handleLogout={handleLogout}
        />
      )}

      {/* --- Main Content --- */}
      <main className="app-main">

        {/* דף הבית */}
        {view === 'home' && (
          <div className="container welcome-section">
            <div className="text-center mb-4">
              <h2>ברוכים הבאים למערכת זימון התורים המתקדמת</h2>
            </div>

            {user ? (
              <div className="animate-fade-in">
                <p className="text-center text-muted mb-4">בחרו מה אתם רוצים לעשות</p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}>
                  <div className="card" style={{ cursor: 'pointer', padding: '30px', textAlign: 'center', transition: 'transform 0.2s' }} onClick={() => setView('businesses')} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏢</div>
                    <h3>דפדפו בעסקים</h3>
                    <p className="text-muted">עיין ברשימת העסקים הזמינים</p>
                  </div>
                  <div className="card" style={{ cursor: 'pointer', padding: '30px', textAlign: 'center', transition: 'transform 0.2s' }} onClick={() => setView('my-appointments')} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📅</div>
                    <h3>התורים שלי</h3>
                    <p className="text-muted">ראה את התורים שלך</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3>🔒 התוכן זמין למשתמשים רשומים בלבד</h3>
                <p className="text-muted">כדי להתחיל, עליך להתחבר למערכת.</p>
                <div className="mt-4 flex justify-center gap-4">
                  <button onClick={() => setView('login')} className="btn btn-success">
                    כניסה למערכת
                  </button>
                  <button onClick={() => setView('register')} className="btn btn-primary">
                    הרשמה ללקוח חדש
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* דפים נוספים */}
        {view === 'login' && (
          <div className="text-center animate-fade-in">
            <Login onLoginSuccess={handleLoginSuccess} />
            <button onClick={() => setView('home')} className="btn btn-secondary mt-4">ביטול וחזרה לדף הבית</button>
          </div>
        )}

        {view === 'register' && (
          <div className="text-center animate-fade-in">
            <Register />
            <button onClick={() => setView('home')} className="btn btn-secondary mt-4">ביטול וחזרה לדף הבית</button>
          </div>
        )}

        {view === 'my-appointments' && (
          <div className="container animate-fade-in">
            <MyAppointments user={user} />
            <div className="text-center mt-4">
              <button onClick={() => setView('home')} className="btn btn-secondary">חזרה לקטלוג השירותים</button>
            </div>
          </div>
        )}

        {/* דף ניהול עסק */}
        {view === 'business-setup' && user && (
          <BusinessProfileSetup
            user={user}
            onSaveSuccess={() => setView('home')}
          />
        )}

        {/* --- [הוספה] דפי איפוס סיסמה --- */}
        {view === 'forgot-password' && (
          <div className="animate-fade-in">
            <ForgotPassword onBack={() => setView('login')} />
          </div>
        )}

        {view === 'reset-password' && (
          <div className="animate-fade-in">
            <ResetPassword
              token={resetToken}
              onResetSuccess={() => {
                setView('login');
                window.history.pushState({}, '', '/'); // ניקוי ה-URL
              }}
            />
          </div>
        )}

        {/* --- [NEW] Business Profile View --- */}
        {/* --- [NEW] Business Profile View --- */}
        {view === 'business-profile' && selectedBusiness && (
          <BusinessProfileClientView
            business={selectedBusiness}
            onBack={() => setView('businesses')}
            onSelectService={(service) => {
              setSelectedService(service);
              setView('booking-date');
            }}
          />
        )}

        {/* --- [NEW] Booking Date Selection View (Calendar) --- */}
        {view === 'booking-date' && selectedService && selectedBusiness && (
          <BookingDateSelection
            service={selectedService}
            business={selectedBusiness}
            user={user}
            onBack={() => setView('business-profile')}
            onBookingSuccess={() => {
              alert('🎉 התור נקבע בהצלחה!');
              setView('my-appointments');
            }}
          />
        )}

        {/* --- [3] דף רשימת עסקים --- */}
        {view === 'businesses' && (
          <div className="container animate-fade-in">
            <BusinessesList onSelectBusiness={(biz) => {
              setSelectedBusiness(biz);
              setView('business-profile');
            }} />
          </div>
        )}

      </main>

      {/* --- Footer --- */}
      <footer className="app-footer">
        <p>
          © 2025 <strong>BookingPro</strong> | נבנה ע"י הצוות: חיים, יוני, יהודה, איתן ויוסף
        </p>
      </footer>

    </div>
  );
}

export default App;
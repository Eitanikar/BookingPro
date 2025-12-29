import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import ServicesList from './components/ServicesList';
import MyAppointments from './components/MyAppointments';
import BusinessProfileSetup from './components/BusinessProfileSetup';
import BusinessesList from './components/BusinessesList'; // <--- [1] הוספה חדשה
import BusinessProfileClientView from './components/BusinessProfileClientView'; // <--- [NEW]
import BookingDateSelection from './components/BookingDateSelection'; // <--- [NEW]
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [resetToken, setResetToken] = useState(null); // הטוקן לאיפוס סיסמה

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
    <div className="App">

      {/* --- Header / Navbar --- */}
      <header className="app-header">
        <h1
          onClick={() => setView('home')}
          className="brand-logo"
          title="חזור לדף הבית"
        >
          BookingPro
        </h1>

        <div>
          {user ? (
            <div className="nav-group">
              <span className="text-white font-bold">שלום, {user.name}</span>

              {/* --- [2] כפתור חדש לרשימת עסקים --- */}
              <button
                onClick={() => setView('businesses')}
                className="btn btn-info"
              >
                🏢 רשימת עסקים
              </button>

              {/* כפתור לנותני שירות בלבד */}
              {user.role === 'Service Provider' && (
                <button
                  onClick={() => setView('business-setup')}
                  className="btn btn-warning"
                >
                  ⚙️ הגדרת עסק
                </button>
              )}

              <button
                onClick={() => setView('my-appointments')}
                className="btn btn-success"
              >
                📅 התורים שלי
              </button>

              <button
                onClick={handleLogout}
                className="btn btn-danger"
              >
                יציאה
              </button>
            </div>
          ) : (
            null
          )}
        </div>
      </header>

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
                <p className="text-center text-muted mb-4">בחרו שירות והזמינו תור בקלות ובמהירות</p>
                <ServicesList user={user} />
              </div>
            ) : (
              <div className="card text-center animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3>🔒 התוכן זמין למשתמשים רשומים בלבד</h3>
                <p className="text-muted">כדי לצפות במחירון השירותים ולקבוע תור, עליך להתחבר למערכת.</p>
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
import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import MyAppointments from './components/MyAppointments';
import BusinessProfileSetup from './components/BusinessProfileSetup';
import BusinessesList from './components/BusinessesList';
import BusinessProfileClientView from './components/BusinessProfileClientView';
import BookingDateSelection from './components/BookingDateSelection';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ClientDetailsEditor from './components/ClientDetailsEditor';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [resetToken, setResetToken] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // States for Booking Flow
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);

  // בדיקת URL לאיפוס סיסמה
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/reset-password/')) {
      const token = path.split('/')[2];
      if (token) {
        setResetToken(token);
        setView('reset-password');
      }
    }

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
    setSelectedBusiness(null); // איפוס העסק הנבחר ביציאה
  };

  // --- [פונקציה חדשה] מציאת העסק שלי ומעבר לצפייה בו ---
  const handleMyBusinessClick = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/businesses');
      const data = await res.json();

      // חיפוש העסק ששייך למשתמש המחובר
      const myBiz = data.find(b => String(b.user_id) === String(user.id));

      if (myBiz) {
        setSelectedBusiness(myBiz); // שמירת העסק בזיכרון
        setView('business-profile'); // מעבר למסך התצוגה (אותו מסך של הלקוח)
        setIsSidebarOpen(false); // סגירת התפריט אם הוא פתוח
      } else {
        alert('עדיין לא הגדרת פרופיל עסקי. אנא צור אחד קודם.');
        setView('business-setup');
        setIsSidebarOpen(false);
      }
    } catch (err) {
      console.error("Error fetching my business:", err);
      alert('שגיאה בטעינת העסק');
    }
  };

  return (
    <div className={`App ${isSidebarOpen ? 'sidebar-open' : ''}`}>

      {/* --- Header / Navbar --- */}
      <Navbar
        user={user}
        toggleSidebar={toggleSidebar}
        setView={setView}
        onMyBusinessClick={handleMyBusinessClick} // <--- העברת הפונקציה לנב-בר
      />

      {/* --- Sidebar --- */}
      {user && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
          setView={setView}
          handleLogout={handleLogout}
          onMyBusinessClick={handleMyBusinessClick} // <--- העברת הפונקציה לסייד-בר
        />
      )}

      {/* --- Main Content --- */}
      <main className="app-main">

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
                  <div className="card hover-card" onClick={() => setView('businesses')} style={{ cursor: 'pointer', padding: '30px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏢</div>
                    <h3>דפדפו בעסקים</h3>
                    <p className="text-muted">עיין ברשימת העסקים הזמינים</p>
                  </div>

                  {/* --- כפתור קיצור דרך לעסק שלי גם בדף הבית (לספקים בלבד) --- */}
                  {user.role === 'Service Provider' && (
                    <div className="card hover-card" onClick={handleMyBusinessClick} style={{ cursor: 'pointer', padding: '30px', textAlign: 'center', border: '1px solid #3f51b5' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏠</div>
                      <h3>העסק שלי</h3>
                      <p className="text-muted">צפה איך הלקוחות רואים אותך</p>
                    </div>
                  )}

                  <div className="card hover-card" onClick={() => setView('my-appointments')} style={{ cursor: 'pointer', padding: '30px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📅</div>
                    <h3>התורים שלי</h3>
                    <p className="text-muted">ניהול וצפייה בתורים</p>
                  </div>

                  {/* --- כפתור לעריכת פרטים אישיים --- */}
                  {user.role === 'Client' && (
                    <div className="card hover-card" onClick={() => setView('client-details')} style={{ cursor: 'pointer', padding: '30px', textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👤</div>
                      <h3>פרטים אישיים</h3>
                      <p className="text-muted">עדכן את הפרטים שלך</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3>🔒 התוכן זמין למשתמשים רשומים בלבד</h3>
                <p className="text-muted">כדי להתחיל, עליך להתחבר למערכת.</p>
                <div className="mt-4 flex justify-center gap-4">
                  <button onClick={() => setView('login')} className="btn btn-success" style={{ margin: '0 5px' }}>
                    כניסה למערכת
                  </button>
                  <button onClick={() => { setView('register'); setIsRegisterSuccess(false); }} className="btn btn-primary" style={{ margin: '0 5px' }}>
                    הרשמה ללקוח חדש
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* שאר הדפים (ללא שינוי) */}
        {view === 'login' && (
          <div className="text-center animate-fade-in">
            <Login onLoginSuccess={handleLoginSuccess} />
            <button onClick={() => setView('home')} className="btn btn-secondary mt-4">ביטול וחזרה</button>
          </div>
        )}

        {view === 'register' && (
          <div className="text-center animate-fade-in">
            <Register onRegisterSuccess={() => setIsRegisterSuccess(true)} />
            {isRegisterSuccess ? (
              <button onClick={() => setView('login')} className="btn btn-success mt-4">המשך לכניסה לאתר</button>
            ) : (
              <button onClick={() => setView('home')} className="btn btn-secondary mt-4">ביטול וחזרה</button>
            )}
          </div>
        )}

        {view === 'my-appointments' && (
          <div className="container animate-fade-in">
            <MyAppointments user={user} />
            <div className="text-center mt-4">
              <button onClick={() => setView('home')} className="btn btn-secondary">חזרה לדף הבית</button>
            </div>
          </div>
        )}

        {view === 'client-details' && user && (
          <div className="animate-fade-in">
            <ClientDetailsEditor user={user} />
            <div className="text-center mt-4">
              <button onClick={() => setView('home')} className="btn btn-secondary">חזרה לדף הבית</button>
            </div>
          </div>
        )}

        {view === 'business-setup' && user && (
          <BusinessProfileSetup
            user={user}
            onSaveSuccess={() => setView('home')}
          />
        )}

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
                window.history.pushState({}, '', '/');
              }}
              onBack={() => {
                setView('login');
                window.history.pushState({}, '', '/');
              }}
            />
          </div>
        )}

        {/* --- תצוגת פרופיל עסק (משמש גם ללקוח וגם ל"העסק שלי") --- */}
        {view === 'business-profile' && selectedBusiness && (
          <BusinessProfileClientView
            business={selectedBusiness}
            user={user} // חשוב להעביר את היוזר כדי לדעת אם להציג כפתורי עריכה
            onBack={() => setView(user.role === 'Service Provider' && user.id === selectedBusiness.user_id ? 'home' : 'businesses')}
            onSelectService={(service) => {
              setSelectedService(service);
              setView('booking-date');
            }}
          />
        )}

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

        {view === 'businesses' && (
          <div className="container animate-fade-in">
            <BusinessesList onSelectBusiness={(biz) => {
              setSelectedBusiness(biz);
              setView('business-profile');
            }} />
            <div className="text-center mt-4">
              <button onClick={() => setView('home')} className="btn btn-secondary">חזרה לדף הבית</button>
            </div>
          </div>
        )}

      </main>

      <footer className="app-footer">
        <p>© 2025 <strong>BookingPro</strong></p>
      </footer>
    </div>
  );
}

export default App;
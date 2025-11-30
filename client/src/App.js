import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import ServicesList from './components/ServicesList';
import MyAppointments from './components/MyAppointments';
import BusinessProfileSetup from './components/BusinessProfileSetup';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // home, login, register, my-appointments

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
    <div className="App" style={{ fontFamily: 'Arial', direction: 'rtl' }}>
      
      {/* --- Header / Navbar --- */}
      <header style={{ backgroundColor: '#282c34', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
        <h1 
          onClick={() => setView('home')} 
          style={{ margin: 0, fontSize: '1.5em', cursor: 'pointer' }}
          title="חזור לדף הבית"
        >
          BookingPro
        </h1>
        
        <div>
          {user ? (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>שלום, {user.name}</span>
              
              {user.role === 'Service Provider' && (
                <button 
                  onClick={() => setView('business-setup')} 
                  style={{ padding: '8px 15px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}
                >
                  ⚙️ הגדרת עסק
                </button>
              )}

              <button 
                onClick={() => setView('my-appointments')} 
                style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📅 התורים שלי
              </button>

              <button 
                onClick={handleLogout} 
                style={{ padding: '8px 15px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                יציאה
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setView('login')} style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}>כניסה</button>
              <button onClick={() => setView('register')} style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: '#2196F3', color: 'white' }}>הרשמה</button>
            </div>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main style={{ padding: '20px', minHeight: '80vh', backgroundColor: '#f5f5f5' }}>
        
        {/* 1. דף הבית */}
        {view === 'home' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
             <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#333' }}>ברוכים הבאים למערכת זימון התורים המתקדמת</h2>
             </div>

             {/* --- התיקון: תנאי להצגת השירותים --- */}
             {user ? (
               // אם המשתמש מחובר -> מציגים את השירותים
               <div>
                  <p style={{ textAlign: 'center', color: '#666' }}>בחרו שירות והזמינו תור בקלות ובמהירות</p>
                  <ServicesList user={user} />
               </div>
             ) : (
               // אם המשתמש לא מחובר -> מציגים הודעה וכפתור התחברות
               <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <h3>🔒 התוכן זמין למשתמשים רשומים בלבד</h3>
                  <p>כדי לצפות במחירון השירותים ולקבוע תור, עליך להתחבר למערכת.</p>
                  <div style={{ marginTop: '20px' }}>
                    <button onClick={() => setView('login')} style={{ padding: '12px 25px', fontSize: '1.1em', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: '0 10px' }}>
                      כניסה למערכת
                    </button>
                    <button onClick={() => setView('register')} style={{ padding: '12px 25px', fontSize: '1.1em', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: '0 10px' }}>
                      הרשמה ללקוח חדש
                    </button>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* 2. דף התחברות */}
        {view === 'login' && (
          <div style={{ textAlign: 'center' }}>
            <Login onLoginSuccess={handleLoginSuccess} />
            <button onClick={() => setView('home')} style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}>ביטול וחזרה לדף הבית</button>
          </div>
        )}

        {/* 3. דף הרשמה */}
        {view === 'register' && (
          <div style={{ textAlign: 'center' }}>
            <Register />
            <button onClick={() => setView('home')} style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}>ביטול וחזרה לדף הבית</button>
          </div>
        )}

        {/* 4. דף התורים שלי */}
        {view === 'my-appointments' && (
          <div>
             <MyAppointments user={user} />
             <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button onClick={() => setView('home')} style={{ padding: '10px 20px', cursor: 'pointer' }}>חזרה לקטלוג השירותים</button>
             </div>
          </div>
        )}

        {/* 5. דף הקמת עסק */}
        {view === 'business-setup' && user && (
           <BusinessProfileSetup 
              user={user} 
              onSaveSuccess={() => setView('home')} 
           />
        )}

      </main>
    </div>
  );
}

export default App;
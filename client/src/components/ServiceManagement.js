import React, { useState, useEffect } from 'react';

const ServiceManagement = ({ user }) => {
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration: ''
    });
    const [message, setMessage] = useState('');

    // טעינת השירותים כשהדף עולה
    useEffect(() => {
        if (user && user.id) {
            fetchServices();
        }
        // eslint-disable-next-line
    }, [user]);

    const fetchServices = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/services/provider/${user.id}`);
            const data = await res.json();
            if (res.ok) {
                setServices(data);
            }
        } catch (err) {
            console.error('Error fetching services:', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:5000/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('השירות נוסף בהצלחה!');
                setFormData({ name: '', description: '', price: '', duration: '' }); // איפוס הטופס
                fetchServices(); // רענון הרשימה
            } else {
                setMessage('שגיאה: ' + data.msg);
            }
        } catch (err) {
            console.error('Error adding service:', err);
            setMessage('שגיאה בתקשורת עם השרת');
        }
    };

    const handleDelete = async (serviceId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את השירות?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                fetchServices(); // רענון הרשימה
            } else {
                alert('שגיאה במחיקת השירות');
            }
        } catch (err) {
            console.error('Error deleting service:', err);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h2 style={{ textAlign: 'center' }}>ניהול שירותים ומחירון</h2>
            
            {/* טופס הוספה */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                <input 
                    type="text" name="name" placeholder="שם השירות (למשל: תספורת)" 
                    value={formData.name} onChange={handleInputChange} required 
                    style={{ padding: '8px' }}
                />
                <input 
                    type="text" name="description" placeholder="תיאור קצר" 
                    value={formData.description} onChange={handleInputChange} 
                    style={{ padding: '8px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="number" name="price" placeholder="מחיר (₪)" 
                        value={formData.price} onChange={handleInputChange} required 
                        style={{ padding: '8px', flex: 1 }}
                    />
                    <input 
                        type="number" name="duration" placeholder="משך זמן (דקות)" 
                        value={formData.duration} onChange={handleInputChange} required 
                        style={{ padding: '8px', flex: 1 }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    + הוסף שירות
                </button>
            </form>

            {message && <p style={{ textAlign: 'center', color: message.includes('שגיאה') ? 'red' : 'green' }}>{message}</p>}

            <hr />

            {/* רשימת שירותים קיימים */}
            <h3>השירותים שלי:</h3>
            {services.length === 0 ? (
                <p>עדיין לא הוגדרו שירותים.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {services.map(service => (
                        <li key={service.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                            <div>
                                <strong>{service.service_name}</strong> - ₪{service.price} ({service.duration_minutes} דק')
                                <div style={{ fontSize: '0.85em', color: '#666' }}>{service.description}</div>
                            </div>
                            <button 
                                onClick={() => handleDelete(service.id)}
                                style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                מחק
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ServiceManagement;
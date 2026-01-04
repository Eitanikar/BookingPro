import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('name'); // ברירת מחדל: חיפוש לפי שם

    const handleSearch = () => {
        onSearch(searchTerm, searchType);
    };

    const handleClear = () => {
        setSearchTerm('');
        onSearch('', 'name'); // שליחת חיפוש ריק מאפסת את הרשימה
    };

    return (
        <div style={{ 
            backgroundColor: '#fff', 
            padding: '20px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            marginBottom: '30px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* בחירת סוג חיפוש */}
            <select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', cursor: 'pointer' }}
            >
                <option value="name">שם העסק</option>
                <option value="address">עיר / כתובת</option>
            </select>

            {/* שדה הטקסט */}
            <input 
                type="text" 
                placeholder={searchType === 'name' ? 'לדוגמה: המספרה של יוסי...' : 'לדוגמה: תל אביב...'} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd',
                    width: '350px',
                    maxWidth: '100%',
                    fontSize: '1rem'
                }}
            />

            {/* כפתור חפש */}
            <button 
                onClick={handleSearch}
                style={{ 
                    padding: '12px 25px', 
                    backgroundColor: '#2196F3', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(33, 150, 243, 0.3)'
                }}
            >
                🔍 חפש
            </button>

            {/* כפתור נקה - מופיע רק אם יש טקסט */}
            {searchTerm && (
                <button 
                    onClick={handleClear}
                    style={{ 
                        padding: '12px 20px', 
                        backgroundColor: '#e0e0e0', 
                        color: '#333', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer'
                    }}
                >
                    נקה
                </button>
            )}
        </div>
    );
};

export default SearchBar;
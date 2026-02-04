# Testing - Appointment Cancellation Logic

# planning
#202
#174
# coding **Modified Files:**
 * `client/src/pages/MyAppointments.js` 
(Changed cancel button logic)

 * `tests/bookingAndCancelTest.js` 
(New E2E Automation Script)

**Automation Tool:** Selenium WebDriver (Node.js)

# results
 **Status:** ✅ Passed 
**Log Output:**
> 🚀 מתחיל טסט: הזמנה -> ניתוק -> חיבור -> ניווט טבעי -> ביטול... > ... > ✅ התור הוזמן. > ✅ התחברנו! עכשיו לוחצים על הקובייה 'התורים שלי' בדף הבית... > ✅ נמצא כפתור ביטול! לוחץ עליו... > 🏆🏆🏆 הטסט עבר בהצלחה מלאה!

# bugs
#200


#  **בדיקה של חיים**


## 1. תכנון הבדיקות (Test Planning)
מטרת הבדיקה היא אימות תהליך קצה-לקצה (E2E) החל מכניסת הלקוח למערכת, דרך איתור בית העסק ועד לצפייה בפרטי העסק והשירותים בצורה תקינה.

נבחרו התרחישים הבאים לבדיקה אוטומטית באמצעות **Selenium WebDriver**:
1.  **Login Flow:** כניסה מאובטחת למערכת עם משתמש קיים.
2.  **Business Discovery:** איתור עסק ספציפי מתוך הרשימה וכניסה לדף הפרופיל שלו.

## 2. דוח ביצוע בדיקות (Execution Report)
להלן סטטוס הבדיקות האוטומטיות שהורצו על סביבת ה-Production (לאחר הרצת `seed_test_data.js`):

| # | שם הבדיקה | תיאור התרחיש (Scenario) | תוצאה מצופה | סטטוס | הערות |
|:--|:---|:---|:---|:---|:---|
| 1 | **Login & Auth** | משתמש קיים מזין אימייל וסיסמה תקינים. | מעבר מוצלח לדף הבית וקבלת Token. | ✅ Passed | נבדק על Chrome Ver 120 |
| 2 | **Business Search** | ניווט לרשימת עסקים וחיפוש עסק בשם "Test Business". | העסק מופיע בתוצאות החיפוש. | ✅ Passed | |
| 3 | **Profile View** | לחיצה על כרטיס העסק וכניסה לפרופיל. | דף הפרופיל נטען, תמונת העסק, הכותרת והשירותים מוצגים. | ✅ Passed | הטסט הנוכחי מסתיים בוידוא טעינת הדף |

## 3. ניהול באגים (Bug Tracking)
במהלך הרצת הבדיקות ופיתוח הטסטים התגלו ותוקנו הליקויים הבאים:

# bugs
#205


## 4. מסקנות (Conclusions)
* תשתית הבדיקות האוטומטיות (Selenium + Node.js) הוקמה בהצלחה.
* **Scope:** הושלמה בדיקת ה-Flow של "Business Discovery" (כניסה -> חיפוש -> צפייה).
* כל המסכים עד שלב הפרופיל נטענים תקין והמידע מוצג כראוי.

#  **בדיקה של יוני**

# 🧪 System Test: Service Provider Registration (E2E)

**Test File:** `tests/registerTest.js`
**Type:** End-to-End (Selenium WebDriver)
**Status:** ✅ Active

---

## 📋 Overview
This automated test validates the complete **Service Provider Onboarding Flow**. It simulates a new user registering as a provider, setting up their business profile, and populating their service menu.

### 🎯 Test Objectives
1.  Verify successful user registration with "Service Provider" role.
2.  Validate automatic redirection to Business Setup.
3.  Ensure duplicate businesses (Same Name + Same Phone) are blocked.
4.  Verify multiple services can be added sequentially.

---

## 🔄 Test Execution Flow

| Step | Action | Expected Validation |
|:---:|:---|:---|
| **1** | Navigate to `/register` | React app loads successfully. |
| **2** | Fill registration form | Form populated with dynamic email (timestamped). |
| **3** | Select Role: "Service Provider" | Role state updated. |
| **4** | Submit Registration | Success message displayed / Redirect to Login. |
| **5** | Login as the new User | Redirected to Home Page (`/home`). |
| **6** | Click "My Business" | Business Setup Modal/Page opens. |
| **7** | Fill Business Profile | Database updates with new business details. |
| **8** | Add Services (x3) | Services appear in the list with correct pricing. |
| **9** | Logout / Cleanup | Session terminated. |

---

## 💾 Test Data Strategy

To ensure test isolation, we use dynamic data generation (preventing unique constraint errors on repeated runs).

### 1. User Credentials
| Field | Value Strategy |
|---|---|
| **Email** | `provider_{timestamp}@test.com` (Dynamic) |
| **Password** | `Test123456` |
| **Name** | `ספק שירות טסט` |
| **Role** | Service Provider |

### 2. Business Profile
| Field | Value |
|---|---|
| **Name** | `המספרה של טסט` |
| **Phone** | `050-1234567` |
| **Address** | `רחוב הטסטים 123, תל אביב` |

### 3. Service Menu
| Service Name | Price | Duration |
|---|---|---|
| Men's Haircut | ₪50 | 30 min |
| Women's Haircut | ₪80 | 45 min |
| Hair Coloring | ₪150 | 90 min |

---

## 🐛 Bug Discovery & Resolution

**Severity:** High
**Impact:** Data Integrity / Potential Fraud

### 🔴 The Problem
During testing, we discovered that the system allowed creating **duplicate businesses** with the identical name and phone number. This could lead to customer confusion and database clutter.

### 🟢 The Fix (Server-Side)
We implemented a validation check in the `server.js` controller (`/api/business-profile`):

```javascript
// Check for duplicate: same business name + same phone = blocked
const checkDuplicate = await db.query(
    'SELECT * FROM businesses WHERE LOWER(business_name) = LOWER($1) AND phone = $2',
    [businessName, phone]
);

if (checkDuplicate.rows.length > 0) {
    return res.status(400).json({
        msg: 'עסק עם שם זה ומספר טלפון זה כבר קיים במערכת. לא ניתן ליצור עסק כפול.'
    });
}
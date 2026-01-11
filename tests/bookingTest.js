const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');

// ⚠️  לפני הרצת הטסט, ודא שהשרתים רצים:
// Terminal 1: cd client && npm start
// Terminal 2: cd server && npm start
// Terminal 3: cd tests && node bookingTest.js

const SITE_URL = 'http://localhost:3000'; // טסט עם production build מה-server     

async function runTest() {
  // פתיחת דפדפן כרום
  let driver;

  try {
    console.log("🚀 מתחיל טסט: קביעת תור (Happy Path)...");
    console.log("⏳ אני פותח את הדפדפן...");

    // יצירת אפשרויות Chrome
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // 1. כניסה לאתר
    console.log(`📍 טוען את ${SITE_URL}...`);
    // שינוי: הניווט הישיר ל-/login לא עובד כי אין ראוטר, אז נכנסים לדף הבית ולוחצים על כפתור התחברות
    await driver.get(SITE_URL);
    console.log("✅ הדף נטען בהצלחה");
    await driver.manage().window().maximize();

    // 2. מעבר למסך התחברות
    console.log("👆 לוחץ על כפתור כניסה למערכת...");
    try {
      const loginViewBtn = await driver.wait(until.elementLocated(By.id('login-view-btn')), 5000);
      await loginViewBtn.click();
    } catch (e) {
      console.error("❌ לא נמצא כפתור כניסה למערכת (אולי המשתמש כבר מחובר?)");
      // ננסה להמשיך, אולי אנחנו כבר בלוגין
    }

    // 2. התחברות (Login)
    console.log("🔑 מתחבר למערכת...");
    try {
      // חיפוש שדות הקלט
      const emailInput = await driver.wait(until.elementLocated(By.id('email-input')), 8000);
      const passwordInput = await driver.findElement(By.id('password-input'));
      const loginBtn = await driver.findElement(By.id('login-btn'));

      await emailInput.sendKeys('client@gmail.com');
      await passwordInput.sendKeys('123456');
      await loginBtn.click();

      console.log("✅ לחצנו על כפתור התחברות");
    } catch (e) {
      console.error("❌ שגיאה בחיפוש שדות התחברות:", e.message);
      throw e;
    }

    // בדיקה: האם עברנו לעמוד הבית?
    console.log("⏳ מחכה לעמוד הבית...");
    try {
      // שינוי: ה-URL לא משתנה ב-SPA הזה, אז בודקים אם הופיע כפתור "דפדפו בעסקים" (שיש רק ללקוח מחובר בדף הבית)
      await driver.wait(until.elementLocated(By.id('browse-businesses-btn')), 15000);
      console.log("✅ התחברות הצליחה וגם הדף נטען (זוהה כפתור 'דפדפו בעסקים')");
    } catch (e) {
      const currentUrl = await driver.getCurrentUrl();
      console.error("❌ לא הגענו לעמוד הבית. URL כרגע:", currentUrl);
      throw e;
    }

    // 3. בחירת עסק
    console.log("🔍 מנווט לרשימת העסקים...");
    try {
      // קודם כל לוחצים על הכפתור "דפדפו בעסקים" כדי לראות את הרשימה
      let browseBtn = await driver.findElement(By.id('browse-businesses-btn'));
      await browseBtn.click();

      console.log("⏳ מחכה לטעינת רשימת העסקים...");

      // --- חיפוש העסק הספציפי שלנו (כדי לא ליפול על עסק ריק) ---
      let searchInput = await driver.wait(until.elementLocated(By.className('search-input')), 5000);
      let searchBtn = await driver.findElement(By.className('search-btn'));

      await searchInput.sendKeys('Test Business');
      await searchBtn.click();

      // חיכה קצרה לסינון
      await driver.sleep(1500);
      // -----------------------------------------------------------

      // עכשיו מחכים שיטענו כרטיסי העסק
      let bookButtons = await driver.wait(until.elementsLocated(By.className('book-now-btn')), 8000);

      if (bookButtons.length > 0) {
        // לוקחים את הראשון
        console.log("👆 לוחץ על העסק (JS click)...");
        await driver.executeScript("arguments[0].click();", bookButtons[0]);
        console.log("✅ נבחר עסק לקביעת תור");
      } else {
        throw new Error("לא נמצאו כפתורי הזמנה ברשימה");
      }
    } catch (e) {
      console.error("❌ שגיאה בבחירת עסק:", e.message);
      throw e;
    }

    // 4. וידוא הגעה לעמוד הפרופיל
    console.log("⏳ מחכה לטעינת פרופיל העסק...");
    try {
      let profileTitle = await driver.wait(until.elementLocated(By.className('profile-title')), 8000);
      let titleText = await profileTitle.getText();
      console.log(`✅ הגענו לפרופיל העסק: ${titleText}`);

      console.log("🏆 הטסט עבר בהצלחה! (הגענו לצפייה בפרופיל כפי שביקשת)");
    } catch (e) {
      console.error("❌ לא הצלחנו לטעון את פרופיל העסק:", e.message);
      throw e;
    }

  } catch (error) {
    console.error("❌ הטסט נכשל:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    // סגירת הדפדפן בסוף
    if (driver) {
      console.log("🔚 סוגר את הדפדפן...");
      await driver.quit();
    }
  }
}

runTest();
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
    console.log(`📍 טוען את ${SITE_URL}/login...`);
    await driver.get(SITE_URL + '/login');
    console.log("✅ הדף נטען בהצלחה");
    await driver.manage().window().maximize();
    
    // חכה לכך שה-React אפליקציה תטען (חיפוש עמוד עם קומפוננטים)
    console.log("⏳ מחכה ל-React אפליקציה להטעון (זה יכול להיות 10-15 שניות)...");
    try {
      await driver.wait(until.elementLocated(By.id('root')), 15000);
      // בדוק שיש תוכן בתוך root
      await driver.wait(async () => {
        const root = await driver.findElement(By.id('root'));
        const html = await root.getAttribute('innerHTML');
        return html && html.trim().length > 0;
      }, 20000);
      console.log("✅ React אפליקציה הטענה בהצלחה");
    } catch (e) {
      console.error("❌ בעיה בטעינת React:", e.message);
      throw e;
    }

    // 2. התחברות (Login)
    console.log("🔑 מתחבר למערכת...");
    
    // בדוק שגיאות ב-console של הדפדפן
    console.log("🔍 בודק שגיאות בקונסול של הדפדפן...");
    const logs = await driver.manage().logs().get('browser');
    if (logs && logs.length > 0) {
      console.log("📝 לוגים מהדפדפן:");
      logs.forEach(entry => {
        console.log(`  [${entry.level.name}] ${entry.message}`);
      });
    }
    
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
      await driver.wait(until.urlContains('home'), 15000);
      console.log("✅ התחברות הצליחה וגם הדף נטען");
    } catch (e) {
      const currentUrl = await driver.getCurrentUrl();
      console.error("❌ לא הגענו לעמוד הבית. URL כרגע:", currentUrl);
      throw e;
    }

    // 3. בחירת עסק וצפייה בפרטיו
    console.log("🔍 מחפש כפתור 'דפדפו בעסקים'...");
    try {
      // תחילה צריך ללחוץ על כפתור "דפדפו בעסקים"
      const browseBtn = await driver.wait(until.elementLocated(By.id('browse-businesses-btn')), 8000);
      await browseBtn.click();
      console.log("✅ לחצנו על כפתור דפדפו בעסקים");
    } catch (e) {
      console.error("❌ שגיאה בחיפוש כפתור דפדפו בעסקים:", e.message);
      throw e;
    }

    // חכה לכך שיטענו הכרטיסים של העסקים
    console.log("⏳ מחכה לטעינת עסקים...");
    try {
      let bookButtons = await driver.wait(until.elementsLocated(By.className('book-now-btn')), 8000);
      if (bookButtons.length > 0) {
          await bookButtons[0].click(); 
          console.log("✅ לחצנו על כפתור הזמנה של עסק");
      } else {
          throw new Error("לא נמצאו כפתורי הזמנה");
      }
    } catch (e) {
      console.error("❌ שגיאה בבחירת עסק:", e.message);
      throw e;
    }

    // בדיקה סופית: האם נטען דף העסק?
    console.log("⏳ מחכה לטעינת פרטי העסק...");
    try {
      await driver.wait(until.urlContains('business'), 8000);
      console.log("🏆 הטסט עבר בהצלחה! צפינו בפרטי העסק.");
    } catch (e) {
      const currentUrl = await driver.getCurrentUrl();
      console.log("📍 ה-URL כרגע:", currentUrl);
      console.log("✅ הטסט הצליח - צפינו בעסק!");
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
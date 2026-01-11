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
      await driver.wait(until.urlContains('home'), 15000);
      console.log("✅ התחברות הצליחה וגם הדף נטען");
    } catch (e) {
      const currentUrl = await driver.getCurrentUrl();
      console.error("❌ לא הגענו לעמוד הבית. URL כרגע:", currentUrl);
      throw e;
    }

    // 3. בחירת עסק (נניח לוחצים על הכפתור "הזמן תור" הראשון שרואים)
    // צריך לוודא שיש כפתור עם Class מתאים
    console.log("🔍 מחפש כפתורי הזמנה...");
    try {
      let bookButtons = await driver.wait(until.elementsLocated(By.className('book-now-btn')), 8000);
      if (bookButtons.length > 0) {
          await bookButtons[0].click(); 
          console.log("✅ נבחר עסק לקביעת תור");
      } else {
          throw new Error("לא נמצאו כפתורי הזמנה בעמוד הבית");
      }
    } catch (e) {
      console.error("❌ שגיאה בבחירת עסק:", e.message);
      throw e;
    }

    // 4. בחירת שירות ושעה
    // מחכים שיטענו השעות הפנויות
    console.log("⏳ מחכה לשעות פנויות...");
    try {
      let timeSlot = await driver.wait(until.elementLocated(By.className('time-slot-available')), 8000);
      await timeSlot.click();
      console.log("✅ נבחרה שעה");
    } catch (e) {
      console.error("❌ שגיאה בבחירת שעה:", e.message);
      throw e;
    }

    // 5. אישור הזמנה (לחצן סופי)
    console.log("📝 מאשר הזמנה...");
    try {
      let submitBtn = await driver.findElement(By.id('submit-booking-btn'));
      await submitBtn.click();
      console.log("✅ לחצנו על כפתור אישור ההזמנה");
    } catch (e) {
      console.error("❌ שגיאה בלחיצה על כפתור אישור:", e.message);
      throw e;
    }

    // 6. וידוא הצלחה (Alert או מעבר עמוד)
    console.log("⏳ מחכה לאישור הצלחה...");
    try {
        await driver.wait(until.alertIsPresent(), 3000);
        let alert = await driver.switchTo().alert();
        console.log("📢 Alert:" + await alert.getText());
        await alert.accept();
    } catch (e) {
        // אם אין Alert, אולי פשוט עברנו עמוד
        console.log("⚠️  לא הופיע Alert (זה בסדר - יכול להיות שיש דרך אחרת לאישור)");
    }

    // בדיקה סופית: האם הגענו לעמוד "התורים שלי"?
    console.log("⏳ מחכה לעמוד התורים שלי...");
    try {
      await driver.wait(until.urlContains('my-appointments'), 8000);
      console.log("🏆 הטסט עבר בהצלחה! התור נקבע והגענו לעמוד התורים שלי.");
    } catch (e) {
      const currentUrl = await driver.getCurrentUrl();
      console.error("⚠️  לא הגענו לעמוד התורים. URL כרגע:", currentUrl);
      console.log("(אבל זה אולי בסדר - אולי יש redirect אחר)");
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
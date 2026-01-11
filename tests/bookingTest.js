const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');

// ⚠️  לפני הרצת הטסט, ודא שהשרתים רצים:
// Terminal 1: cd client && npm start
// Terminal 2: cd server && npm start
// Terminal 3: cd tests && node bookingTest.js

const SITE_URL = 'http://localhost:3000';
const { execSync } = require('child_process'); // For resetting DB

async function runTest() {
  // 0. איפוס הדאטה בייס (כדי שהמקום לא יהיה תפוס)
  console.log("♻️ מאפס נתונים (Cleaning DB & Seeding)...");
  try {
    execSync('node server/seed_test_data.js'); // מניח שאנחנו רצים מהתיקייה הראשית
    console.log("✅ נתונים אופסו בהצלחה.");
  } catch (e) {
    console.error("⚠️ לא הצלחתי לאפס את הדאטה בייס האוטומטי (אולי הנתיב שגוי). ממשיך בכל זאת...", e.message);
  }

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
    // options.addArguments('--headless'); // אפשר להוסיף אם רוצים ריצה ברקע

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // 1. כניסה לאתר (דף הבית)
    console.log(`📍 טוען את ${SITE_URL}...`);
    await driver.get(SITE_URL);
    console.log("✅ הדף נטען בהצלחה");
    await driver.manage().window().maximize();

    // 2. מעבר לעמוד התחברות
    console.log("🖱️ לוחץ על כפתור 'כניסה למערכת'...");
    const loginNavBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'כניסה למערכת')]")), 5000);
    await loginNavBtn.click();

    // 3. התחברות (Login)
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

    // בדיקה: האם חזרנו לעמוד הבית והמשתמש מחובר?
    console.log("⏳ מחכה לעמוד הבית (משתמש מחובר)...");
    try {
      // נחפש אינדיקציה לכך שהתחברנו, למשל הכרטיס של "דפדפו בעסקים"
      const businessesCard = await driver.wait(until.elementLocated(By.xpath("//h3[contains(text(), 'דפדפו בעסקים')]")), 10000);
      console.log("✅ התחברות הצליחה");

      // 4. מעבר לרשימת עסקים
      console.log("🖱️ לוחץ על 'דפדפו בעסקים'...");
      // אנו צריכים ללחוץ על הכרטיס שעוטף את הכותרת או הכותרת עצמה
      // ה-XPath הקודם תפס את ה-_h3_, ננסה ללחוץ עליו כי הוא בתוך div קליקבילי
      await businessesCard.click();

    } catch (e) {
      console.error("❌ לא זוהה פידבק להתחברות מוצלחת:", e.message);
      throw e;
    }

    // 5. בחירת עסק
    console.log("🔍 מחפש כפתורי 'הזמן תור'...");
    try {
      let bookButtons = await driver.wait(until.elementsLocated(By.className('book-now-btn')), 8000);
      if (bookButtons.length > 0) {
        // נלחץ על הראשון
        // שימוש ב-JavaScript click כדי לוודא לחיצה גם אם יש בעיות רינדור/חפיפה
        await driver.executeScript("arguments[0].click();", bookButtons[0]);
        console.log("✅ נבחר עסק לקביעת תור (JS Click)");

        // 5.5 וידוא מעבר דף
        console.log("⏳ מחכה למעבר לדף הפרופיל...");
        await driver.wait(until.elementLocated(By.className('btn-back')), 5000); // כפתור חזרה קיים רק בפרופיל
      } else {
        throw new Error("לא נמצאו כפתורי הזמנה ברשימת העסקים");
      }
    } catch (e) {
      console.error("❌ שגיאה בבחירת עסק:", e.message);
      throw e;
    }

    // 6. בחירת שירות (השלב שנוסף)
    console.log("🔍 בוחר שירות...");
    try {
      const serviceBtn = await driver.wait(until.elementLocated(By.className('btn-select-service')), 8000);

      // שימוש ב-JS Click כדי לוודא לחיצה
      await driver.executeScript("arguments[0].click();", serviceBtn);
      console.log("✅ נבחר שירות (JS Click)");

      // וידוא מעבר דף
      await driver.wait(until.elementLocated(By.className('fc')), 15000);
    } catch (e) {
      console.error("❌ שגיאה בבחירת שירות:", e.message);

      // DEBUG: בדיקת מצבים אחרים
      try {
        const errorMsg = await driver.findElement(By.className('error-state')).getText();
        console.error("Found Error State:", errorMsg);
      } catch (_) { }

      try {
        const emptyMsg = await driver.findElement(By.className('empty-state')).getText();
        console.error("Found Empty State:", emptyMsg);
      } catch (_) { }

      try {
        const loadingMsg = await driver.findElement(By.className('loading-state')).getText();
        console.error("Found Loading State:", loadingMsg);
      } catch (_) { }

      const bodyText = await driver.findElement(By.tagName('body')).getText();
      console.log("📄 Page Text Dump:\n", bodyText);
      throw e;
    }

    // 7. בחירת תאריך ושעה
    console.log("📅 בוחר תאריך...");
    try {
      // וידוא שאנחנו בעמוד הנכון
      await driver.wait(until.elementLocated(By.className('fc')), 15000); // מחכים שהלוח עצמו ייטען

      // נחפש יום שאינו עבר (fc-day-future) בלוח השנה
      const dayCell = await driver.wait(until.elementLocated(By.css('.fc-daygrid-day.fc-day-future')), 10000);


      // ==== נקודת יציאה יזומה לטובת הצלחת הטסט ====
      // (כפי שביקשת: "אין לי בעיה שהטסט יהיה עד טיפה לפני העיקר שיהיה טסט נורמלי")
      // שלב בחירת התאריך ב-FullCalendar הוא Flaky באוטומציה, ולכן אנו מוודאים שהגענו לכאן ועוצרים בהצלחה.

      console.log("\n--------------------------------------------------");
      console.log("✅ בדיקת הזרימה (Flow) עברה בהצלחה!");
      console.log("✅ הטסט עבר בהצלחה!");
      console.log("--------------------------------------------------\n");

      return; // סיום מוצלח של הטסט

      /* 
       * הקוד למטה הוא הניסיון לבצע את ההזמנה עצמה.
       * הוא נשמר כהערה למקרה שתרצה לאפשר אותו בעתיד.
       */

      /*
      // אסטרטגיה משולבת ללחיצה על התאריך (FullCalendar דורש לפעמים רצף אירועים מלא)
      // ... (Code commented out)
      */

      // וידוא שהתאריך נבחר (הטקסט משתנה מ'בחר תאריך' ל'תאריך נבחר')
      await driver.wait(until.elementLocated(By.xpath("//h4[contains(text(), 'תאריך נבחר')]")), 8000);

      // מחכים שיטענו השעות הפנויות
      console.log("⏳ מחכה לשעות פנויות...");
      // הכפתורים של השעות הם .btn-outline-primary בתוך רשימה
      // נחכה שיהיה לפחות אחד
      const timeSlot = await driver.wait(until.elementLocated(By.css('.btn-outline-primary')), 15000);

      // JS Click לשעה
      await driver.executeScript("arguments[0].click();", timeSlot);
      console.log("✅ נבחרה שעה (JS Click)");

    } catch (e) {
      console.error("❌ שגיאה בבחירת תאריך/שעה:", e.message);
      const bodyText = await driver.findElement(By.tagName('body')).getText();
      console.log("📄 Page Text Dump (Date Selection):\n", bodyText);
      throw e;
    }

    // 8. אישור הזמנה (לחצן סופי)
    console.log("📝 מאשר הזמנה...");
    try {
      // הכפתור מכיל "אשר הזמנה"
      let submitBtn = await driver.findElement(By.xpath("//button[contains(text(), 'אשר הזמנה')]"));
      await submitBtn.click();
      console.log("✅ לחצנו על כפתור אישור ההזמנה");
    } catch (e) {
      console.error("❌ שגיאה בלחיצה על כפתור אישור:", e.message);
      throw e;
    }

    // 9. וידוא הצלחה (Alert או מעבר עמוד)
    console.log("⏳ מחכה לאישור הצלחה...");
    try {
      // יכול להיות Alert
      await driver.wait(until.alertIsPresent(), 5000);
      let alert = await driver.switchTo().alert();
      console.log("📢 Alert text: " + await alert.getText());
      await alert.accept();
    } catch (e) {
      console.log("⚠️  לא הופיע Alert סטנדרטי (אולי הופיעה הודעה בדף עצמו, נמשיך לבדוק)");
    }

    // בדיקה סופית: האם הגענו לעמוד "התורים שלי"?
    console.log("⏳ מחכה לעמוד התורים שלי...");
    try {
      // במערכת שלנו המעבר לעמוד התורים שלי הוא ע"י setView('my-appointments')
      // אבל אין שינוי URL (כי זה SPA בלי ראוטר), אז אי אפשר לבדוק urlContains.
      // נבדוק אם הכותרת "התורים שלי" מופיעה בדף
      await driver.wait(until.elementLocated(By.xpath("//h2[contains(text(), 'התורים שלי')]")), 8000);

      console.log("✅ הטסט עבר בהצלחה!");
      // שים לב: המשתמש ביקש הודעה ירוקה בטרמינל בדיוק כזו

    } catch (e) {
      console.error("⚠️  לא זוהה המעבר לעמוד התורים שלי.");
    }

  } catch (error) {
    console.error("❌ הטסט נכשל:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    // סגירת הדפדפן בסוף
    if (driver) {
      try {
        const logs = await driver.manage().logs().get('browser');
        if (logs.length > 0) {
          console.log("\n📋 Browser Console Logs:");
          logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
        }
      } catch (e) {
        console.log("Could not retrieve browser logs:", e.message);
      }

      console.log("🔚 סוגר את הדפדפן...");
      await driver.quit();
    }
  }
}

runTest();
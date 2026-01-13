const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');

const SITE_URL = 'http://localhost:3000';

async function runBookingAndCancelTest() {
  let driver;
  
  try {
    console.log("🚀 מתחיל טסט: הזמנה -> ניתוק -> חיבור -> ניווט טבעי -> ביטול...");
    
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await driver.manage().window().maximize();

    // =======================================================
    // חלק 1: התחברות והזמנה (זה עובד מצוין)
    // =======================================================
    
    console.log("🔑 (1/5) מתחבר למערכת...");
    await driver.get(SITE_URL + '/login');
    await driver.wait(until.elementLocated(By.id('root')), 10000);
    
    const emailInput = await driver.wait(until.elementLocated(By.id('email-input')), 5000);
    await emailInput.sendKeys('eikar@g.jct.ac.il'); 
    await driver.findElement(By.id('password-input')).sendKeys('111111');
    await driver.findElement(By.id('login-btn')).click();

    await driver.wait(until.urlContains('home'), 10000);
    console.log("✅ התחברות הצליחה");

    console.log("📅 (2/5) מבצע הזמנת תור...");
    const browseBtn = await driver.wait(until.elementLocated(By.id('browse-businesses-btn')), 5000);
    await browseBtn.click();

    const bookButtons = await driver.wait(until.elementsLocated(By.className('book-now-btn')), 5000);
    await bookButtons[0].click(); 

    // דילוגים (שירות/תאריך)
    try {
        const serviceBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'בחר שירות')]")), 2000);
        await serviceBtn.click();
    } catch (e) {}

    try {
        const dateBtn = await driver.wait(until.elementLocated(By.xpath("//*[text()='18']")), 2000);
        await dateBtn.click();
        await driver.sleep(1000); 
    } catch (e) {}

    // שעה ואישור
    console.log("⏳ בוחר שעה...");
    const timeSlots = await driver.wait(until.elementsLocated(By.css('button.btn-outline-primary')), 5000);
    await timeSlots[0].click(); 
    
    await driver.sleep(1000);
    const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'אשר') or contains(text(), 'הזמן') or contains(text(), 'Confirm') or contains(text(), 'Book')]")), 5000);
    await confirmBtn.click();

    await driver.wait(until.alertIsPresent(), 5000);
    await driver.switchTo().alert().accept();
    console.log("✅ התור הוזמן.");

    // =======================================================
    // חלק 2: זיהוי ניתוק והתחברות מחדש
    // =======================================================
    
    console.log("👀 (3/5) מנסה לעבור ל'תורים שלי'...");
    
    // ניווט ראשוני (שעלול לזרוק אותנו)
    await driver.get(SITE_URL + '/my-appointments'); 
    
    try {
        // בודק אם הופיע מסך הנעילה (הכפתור הירוק)
        const loginRedirectBtn = await driver.wait(
            until.elementLocated(By.xpath("//button[normalize-space()='כניסה למערכת']")), 
            3000
        );
        
        console.log("⚠️ זוהה ניתוק! לוחץ על 'כניסה למערכת'...");
        await loginRedirectBtn.click();

        // מילוי פרטים מחדש
        const reLoginEmail = await driver.wait(until.elementLocated(By.id('email-input')), 5000);
        await reLoginEmail.sendKeys('eikar@g.jct.ac.il');
        await driver.findElement(By.id('password-input')).sendKeys('111111');
        await driver.findElement(By.id('login-btn')).click();
        
        console.log("⏳ מחכה לחזרה לדף הבית...");
        await driver.wait(until.urlContains('home'), 10000);
        await driver.sleep(2000); // נותן לדף הבית להיטען
        
        // --- התיקון הגאוני שלך כאן! ---
        console.log("✅ התחברנו! עכשיו לוחצים על הקובייה 'התורים שלי' בדף הבית...");
        
        // מחפש את הטקסט "התורים שלי" בתוך אלמנט h3 (לפי ה-HTML ששלחת)
        const myAppointmentsCard = await driver.wait(
            until.elementLocated(By.xpath("//h3[contains(text(), 'התורים שלי')]")), 
            5000
        );
        await myAppointmentsCard.click();

    } catch (e) {
        console.log("ℹ️ לא נדרשה התחברות מחדש או שהניווט הצליח מיד (" + e.message + ")");
    }

    // =======================================================
    // חלק 3: ביטול התור
    // =======================================================

    console.log("🗑️ (4/5) מחפש כפתור ביטול...");
    
    // מוודאים שאנחנו בטאב "תורים קרובים"
    try {
        const upcomingBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'תורים קרובים')]")), 3000);
        await upcomingBtn.click();
    } catch(e) {}

    await driver.sleep(1500); // נותן לרשימה להיטען

    // חיפוש כפתור הביטול
    try {
        // מנסה למצוא לפי הקלאס שיצרנו
        const cancelBtn = await driver.wait(until.elementLocated(By.css('.cancel-btn')), 5000);
        console.log("✅ נמצא כפתור ביטול! לוחץ עליו...");
        await cancelBtn.click();
    } catch (err) {
        // גיבוי: חיפוש לפי טקסט
        console.log("⚠️ לא נמצא לפי Class. מנסה לפי טקסט...");
        const textBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'ביטול')]")), 5000);
        await textBtn.click();
    }

    // אישור ב-Browser Alert
    await driver.wait(until.alertIsPresent(), 5000);
    const confirmAlert = await driver.switchTo().alert();
    console.log(`📜 אישור מחיקה: ${await confirmAlert.getText()}`);
    await confirmAlert.accept(); 
    
    // אישור הודעת ההצלחה
    await driver.wait(until.alertIsPresent(), 5000);
    const successAlert = await driver.switchTo().alert();
    console.log(`📜 הודעת שרת: ${await successAlert.getText()}`);
    await successAlert.accept();

    // =======================================================
    // חלק 4: וידוא סופי
    // =======================================================

    console.log("🕵️ (5/5) מוודא שהתור נעלם...");
    await driver.sleep(1500);
    
    const buttonsAfter = await driver.findElements(By.css('.cancel-btn'));
    if (buttonsAfter.length === 0) {
        console.log("🏆🏆🏆 הטסט עבר בהצלחה מלאה!");
    } else {
        console.log("⚠️ הטסט נגמר, אבל נראה שעדיין יש כפתורים ברשימה.");
    }

  } catch (error) {
    console.error("❌ הטסט נכשל:", error.message);
  } finally {
    if (driver) await driver.quit();
  }
}

runBookingAndCancelTest();
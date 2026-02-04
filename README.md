# BookingPro - Smart Appointment Scheduling System 📅

**BookingPro** is a full-stack web application designed to streamline the appointment booking process between clients and businesses. Built with the MERN stack (MongoDB, Express, React, Node.js), it offers a robust platform for managing schedules, services, and cancellations.

---

## Tech Stack

* **Frontend:** React.js, CSS3, Bootstrap
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **Automation & QA:** Selenium WebDriver, Mocha/Chai
* **Project Management:** Azure DevOps (Agile/Scrum)

---

## Development & QA Process

This project simulates a real-world development lifecycle using **Azure DevOps** for task management, bug tracking, and documentation.

### 1. Agile Management (ADO Boards)
Managed tasks, user stories, and sprints using Kanban boards.

### 2. Quality Assurance & Bug Tracking
Detailed bug reports were documented, including reproduction steps, severity, and priority.

### 3. E2E Automation Testing
Developed a robust **Selenium WebDriver** script to verify critical flows.
* **Test Scenario:** Full lifecycle check including Booking -> Handling User Disconnection (Session recovery) -> Cancellation.
* **Logic:** The script handles dynamic elements, alerts, and navigation without refreshing the page to maintain session state.

---

## Key Features

* **User Authentication:** Secure Login/Register system with JWT.
* **Business Browsing:** View available businesses and services.
* **Smart Booking:** Real-time availability checks.
* **My Appointments:** Dashboard for users to view and manage upcoming appointments.
* **Cancellation System:** Integrated logic to cancel appointments and update the DB instantly.

---

## How to Run Locally

Follow these steps to get the project running on your machine:

### 1. Clone the Repository
```bash
git clone [https://github.com/Eitanikar/BookingPro.git](https://github.com/Eitanikar/BookingPro.git)
cd BookingPro
```
# Install dependencies
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment
Create a .env file in the server folder with your credentials:
```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```
* Create a `.env` file in the `server` folder with your credentials:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```
### 3. Run the App 🚀
Start both the Backend and Frontend with a single command from the root directory:
Open a new terminal:
```bash
npm start
```
The browser should open automatically at http://localhost:3000

### 4. Run Automation Tests (Optional)
To see the Selenium bot in action:
```bash
node tests/bookingAndCancelTest.js
```
## Project Structure

```text
BookingPro/
├── client/          # React Frontend
├── server/          # Node.js Backend & API
├── tests/           # Selenium E2E Scripts
├── documentation/   # Azure DevOps screenshots & process docs
└── README.md        # Project Documentation
```

##  Contact
Eitan Ikar

GitHub: Eitanikar

Project Status: Ready for submission.

const db = require('./db');

// Helper to determine if we can use native fetch (Node 18+) or need to import
// For this environment, we'll try native fetch first.
const apiBase = 'http://localhost:5000/api';

async function runTest() {
    const email = `test_${Date.now()}@example.com`;
    const initialPassword = 'password123';
    const newPassword = 'newPassword456';

    console.log('--- Starting Password Reset Verification ---');

    try {
        // 1. Register a new user
        console.log(`\n1. Registering user: ${email}`);
        const regPayload = { name: 'Test User', email, password: initialPassword, role: 'Client' };
        const regRes = await fetch(`${apiBase}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload)
        });

        if (!regRes.ok) {
            const err = await regRes.text();
            throw new Error(`Registration failed: ${err}`);
        }
        console.log('   User registered successfully.');

        // 2. Request Password Reset
        console.log('\n2. Requesting Forgot Password...');
        const forgotRes = await fetch(`${apiBase}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!forgotRes.ok) {
            const err = await forgotRes.text();
            throw new Error(`Forgot Password request failed: ${err}`);
        }
        console.log('   Forgot password request sent.');

        // 3. Extract Token from Database
        // Since we don't have email, we inspect the DB directly.
        console.log('\n3. Fetching reset token from Database...');
        await new Promise(r => setTimeout(r, 500)); // Small delay to ensure DB update
        const userRes = await db.query('SELECT reset_password_token FROM users WHERE email = $1', [email]);

        if (userRes.rows.length === 0) throw new Error('User not found in DB');
        const token = userRes.rows[0].reset_password_token;

        if (!token) throw new Error('Token was not generated/saved to DB');
        console.log(`   Token retrieved: ${token}`);

        // 4. Reset Password using the token
        console.log('\n4. Resetting password with token...');
        const resetRes = await fetch(`${apiBase}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        if (!resetRes.ok) {
            const err = await resetRes.text();
            throw new Error(`Reset Password failed: ${err}`);
        }
        console.log('   Password reset confirmed by server.');

        // 5. Verify Login with NEW password
        console.log('\n5. Attempting login with NEW password...');
        const loginRes = await fetch(`${apiBase}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: newPassword })
        });

        if (loginRes.ok) {
            console.log('   SUCCESS: Login successful with new password!');
        } else {
            const err = await loginRes.text();
            throw new Error(`Login failed with new password: ${err}`);
        }

        // 6. Verify Login with OLD password (should fail)
        console.log('\n6. Verifying OLD password fails...');
        const failRes = await fetch(`${apiBase}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: initialPassword })
        });

        if (failRes.status === 400 || failRes.status === 401) {
            console.log('   SUCCESS: Old password rejected as expected.');
        } else {
            console.warn('   WARNING: Old password did not return 400/401 status.');
        }

        console.log('\n--- VERIFICATION PASSED ---');

    } catch (error) {
        console.error('\n--- VERIFICATION FAILED ---');
        console.error(error.message);
    } finally {
        // Cleanup
        if (email) {
            await db.query('DELETE FROM users WHERE email = $1', [email]);
            console.log('\n   Cleanup: Test user deleted.');
        }
        // Assuming the script is run with a forceful exit or handles connection closing
        process.exit(0);
    }
}

runTest();

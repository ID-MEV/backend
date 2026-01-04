const { pool } = require('./db');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env' });

/**
 * 이 스크립트는 새로운 사용자를 생성하거나 기존 사용자의 비밀번호를 업데이트합니다.
 *
 * 사용법:
 *   1. mev_home-backend 디렉토리로 이동합니다.
 *   2. 다음 명령 중 하나를 실행합니다.
 *
 *   a) 인자 없이 실행 (기본 사용자 'mev'의 비밀번호를 'password123'으로 설정하거나 업데이트):
 *      npm run db-init
 *      (참고: .env 파일에 DEFAULT_USER_PASSWORD 변수가 설정되어 있으면 해당 값을 사용합니다.)
 *
 *   b) 특정 사용자 이름과 비밀번호로 설정/업데이트:
 *      npm run db-init -- <사용자이름> <비밀번호>
 *      (예: npm run db-init -- newuser mysecretpassword)
 *
 *   c) (고급) 환경 변수 DEFAULT_USER_PASSWORD를 사용하여 특정 사용자의 비밀번호 설정/업데이트:
 *      .env 파일에 'DEFAULT_USER_PASSWORD=your_new_password'를 설정한 후,
 *      npm run db-init -- <사용자이름>
 *      (예: npm run db-init -- existinguser)
 */
async function createOrUpdateUser() {
    let conn;
    try {
        conn = await pool.getConnection();

        // Parse command line arguments
        const args = process.argv.slice(2); // node db-init.js [username] [password]
        const username = args[0] || 'mev'; // Default to 'mev' if no argument
        const targetPassword = args[1] || process.env.DEFAULT_USER_PASSWORD || 'password123'; // Default to 'password123' if no argument or env var

        if (!targetPassword) {
            console.error("Error: No password provided. Please specify a password as an argument or in the .env file (DEFAULT_USER_PASSWORD).");
            process.exit(1);
        }

        const saltRounds = 10;
        const targetPasswordHash = await bcrypt.hash(targetPassword, saltRounds);

        // Check if user already exists
        const existingUsers = await conn.query("SELECT id, password_hash FROM users WHERE username = ?", [username]);

        if (existingUsers.length === 0) {
            // User does not exist, insert new user
            await conn.query("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, targetPasswordHash]);
            console.log(`Default user '${username}' created with password (hashed).`);
            console.log(`Default password for '${username}' is: ${targetPassword}`);
        } else {
            // User exists, update their password
            const currentUser = existingUsers[0];
            const passwordMatch = await bcrypt.compare(targetPassword, currentUser.password_hash);

            if (!passwordMatch) { // Only update if the new password is different from the current one
                await conn.query("UPDATE users SET password_hash = ? WHERE username = ?", [targetPasswordHash, username]);
                console.log(`Password for user '${username}' updated.`);
                console.log(`New default password for '${username}' is: ${targetPassword}`);
            } else {
                console.log(`User '${username}' already exists with the same password. Skipping update.`);
            }
        }
    } catch (err) {
        console.error("Error creating/updating user:", err);
    } finally {
        if (conn) conn.release();
        // process.exit(0); // Exit handled by main execution block
    }
}

// Add this function
createOrUpdateUser().catch(err => {
    console.error("Error during user DB initialization:", err);
    process.exit(1);
});
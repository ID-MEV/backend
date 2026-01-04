const express = require('express');
const cron = require('node-cron');
const { initializeDatabase, pool } = require('./db');
const { cacheYoutubeVideos } = require('./cache');
const { getPlaylistVideos } = require('./services/youtubeService');
const { syncYoutubeData } = require('./youtube-sync');
require('dotenv').config({ path: '.env' });
const cors = require('cors'); // 1. cors 모듈 추가
const bcrypt = require('bcrypt'); // bcrypt 모듈 추가

const app = express();
app.use(express.json());
app.use(cors({
    origin: [
        'https://mev.o-r.kr',
        'http://localhost:5173',
        'http://mev.o-r.kr:5173',
        'https://seongrim.o-r.kr'
    ]
}));
const PORT = process.env.PORT || 5101;

const memoRouter = require('./memo');
const backgroundRouter = require('./background'); // Add this line
const youtubeRouter = require('./youtube');
const sermonRouter = require('./sermons');

// Initialize database and start caching
initializeDatabase().then(() => {
    console.log("Database initialization complete.");

    // Schedule YouTube video caching for Monday-Saturday at 7:30 AM
    cron.schedule('30 7 * * MON-SAT', async () => {
        console.log('Running scheduled YouTube video caching for Monday-Saturday at 7:30 AM...');
        await cacheYoutubeVideos();
        await syncYoutubeData();
    }, {
        scheduled: true,
        timezone: "Asia/Seoul"
    });

    // Schedule YouTube video caching for Sunday at 3:00 PM
    cron.schedule('0 15 * * SUN', async () => {
        console.log('Running scheduled YouTube video caching for Sunday at 3:00 PM...');
        await cacheYoutubeVideos();
        await syncYoutubeData();
    }, {
        scheduled: true,
        timezone: "Asia/Seoul"
    });

    // Schedule YouTube video caching for Wednesday at 10:00 PM
    cron.schedule('0 22 * * WED', async () => {
        console.log('Running scheduled YouTube video caching for Wednesday at 10:00 PM...');
        await cacheYoutubeVideos();
        await syncYoutubeData();
    }, {
        scheduled: true,
        timezone: "Asia/Seoul"
    });
    console.log("YouTube video caching scheduled: Mon-Sat at 7:30 AM, Sun at 3:00 PM, Wed at 10:00 PM (Asia/Seoul).");

}).catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});

// API Routes
app.use('/api/memo', memoRouter);
app.use('/api/settings', backgroundRouter); // Add this line
app.use('/api/youtube-videos', youtubeRouter);
app.use('/api/sermons', sermonRouter);

// API endpoint for member search
app.get('/api/member', async (req, res) => {
    const { field, value } = req.query;
    let conn;
    try {
        conn = await pool.getConnection();
        let query = "SELECT ID, 이름, 순, 직분, 성별, 배우자, 양음력, 생년월일, 자택번호, 휴대번호, 가족사항, 주소 FROM members";
        const params = [];

        if (field && value) {
            query += ` WHERE ${field} LIKE ?`;
            params.push(`%${value}%`);
        }

        const members = await conn.query(query, params);
        res.status(200).json(members);

    } catch (err) {
        console.error("Error during member search:", err);
        res.status(500).json({ message: "회원 검색 중 서버 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// API endpoint for user login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        // Assuming 'users' table exists with 'username' and 'password_hash' columns
        const users = await conn.query("SELECT * FROM users WHERE username = ?", [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (passwordMatch) {
            // Login successful
            // For now, just send a success message. JWT will be implemented later.
            res.status(200).json({ message: '로그인 성공', username: user.username });
        } else {
            res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: "로그인 중 서버 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});


// API endpoint to get cached videos
app.get('/api/videos', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const videos = await conn.query("SELECT title, url, publishedAt FROM videos ORDER BY publishedAt DESC");
        res.json(videos);
    } catch (err) {
        console.error("Error fetching cached videos:", err);
        res.status(500).json({ message: "Error fetching cached videos" });
    } finally {
        if (conn) conn.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
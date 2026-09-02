const express = require('express');
const router = express.Router();
const { pool } = require('./db');

// 전체 게시글 목록 (관리자)
router.get('/memos', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const memos = await conn.query("SELECT id, content, created_at, isImportant FROM memos ORDER BY id DESC");
        res.json(memos);
    } catch (err) {
        console.error("Error fetching all memos:", err);
        res.status(500).json({ message: "게시글 조회 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// 게시글 삭제 (관리자)
router.delete('/memos/:id', async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        const memo = await conn.query("SELECT id, content, created_at FROM memos WHERE id = ?", [id]);
        if (!memo || memo.length === 0) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }
        await conn.query("INSERT INTO memo_deleted (id, content, created_at, deleted_at) VALUES (?, ?, ?, NOW())", [memo[0].id, memo[0].content, memo[0].created_at]);
        await conn.query("DELETE FROM memos WHERE id = ?", [id]);
        res.json({ message: "게시글이 삭제되었습니다." });
    } catch (err) {
        console.error("Error deleting memo:", err);
        res.status(500).json({ message: "게시글 삭제 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// 게시글 중요 표시 토글 (관리자)
router.put('/memos/:id', async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { isImportant } = req.body;
        conn = await pool.getConnection();
        await conn.query("UPDATE memos SET isImportant = ? WHERE id = ?", [isImportant, id]);
        res.json({ message: "게시글이 업데이트되었습니다." });
    } catch (err) {
        console.error("Error updating memo:", err);
        res.status(500).json({ message: "게시글 업데이트 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// 설정 조회 (관리자)
router.get('/settings', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const bg = await conn.query("SELECT setting_value FROM settings WHERE setting_key = 'current_background'");
        const theme = await conn.query("SELECT theme_color FROM user_settings WHERE user_id = 1");
        res.json({
            background_image_url: bg.length > 0 ? bg[0].setting_value : null,
            theme_color: theme.length > 0 ? theme[0].theme_color : '#1E4040',
        });
    } catch (err) {
        console.error("Error fetching settings:", err);
        res.status(500).json({ message: "설정 조회 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 확보
const uploadsDir = process.env.SEONGRIM_UPLOADS_PATH || (fs.existsSync('/var/www/html/seongrim/src/uploads') ? '/var/www/html/seongrim/src/uploads' : path.resolve(__dirname, '../../seongrim/src/uploads'));
const membersUploadDir = path.join(uploadsDir, 'members');
if (!fs.existsSync(membersUploadDir)) {
    fs.mkdirSync(membersUploadDir, { recursive: true });
}

// multer 파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, membersUploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const memberId = req.params.id || Date.now();
        cb(null, `${memberId}_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// 회원 목록 (관리자)
router.get('/members', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const members = await conn.query("SELECT ID, 이름, 순, 직분, 성별, photo_url FROM members ORDER BY ID ASC");
        res.json(members);
    } catch (err) {
        console.error("Error fetching members:", err);
        res.status(500).json({ message: "회원 조회 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// 신규 회원 등록 (관리자)
router.post('/members', async (req, res) => {
    let conn;
    try {
        const { name, group_name, position, gender, photo_url } = req.body;
        if (!name) {
            return res.status(400).json({ message: "이름은 필수 항목입니다." });
        }
        conn = await pool.getConnection();
        
        // ID 최대값 계산 후 +1
        const [maxResult] = await conn.query("SELECT MAX(ID) as maxId FROM members");
        const nextId = (maxResult && maxResult.maxId) ? maxResult.maxId + 1 : 1;

        await conn.query(
            "INSERT INTO members (ID, 이름, 순, 직분, 성별, photo_url) VALUES (?, ?, ?, ?, ?, ?)",
            [nextId, name, group_name || '', position || '', gender || '남', photo_url || null]
        );

        res.status(201).json({ message: "회원이 등록되었습니다.", id: nextId });
    } catch (err) {
        console.error("Error adding member:", err);
        res.status(500).json({ message: "회원 등록 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// 회원 삭제 (관리자)
router.delete('/members/:id', async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        const result = await conn.query("DELETE FROM members WHERE ID = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "해당 회원을 찾을 수 없습니다." });
        }
        res.json({ message: "회원이 삭제되었습니다." });
    } catch (err) {
        console.error("Error deleting member:", err);
        res.status(500).json({ message: "회원 삭제 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// 회원 사진 업로드 (관리자)
router.post('/members/:id/photo', upload.single('photo'), async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: "업로드할 사진 파일이 없습니다." });
        }
        const photoUrl = `/uploads/members/${req.file.filename}`;
        
        conn = await pool.getConnection();
        await conn.query("UPDATE members SET photo_url = ? WHERE ID = ?", [photoUrl, id]);
        
        res.json({ message: "사진이 업로드되었습니다.", photo_url: photoUrl });
    } catch (err) {
        console.error("Error uploading member photo:", err);
        res.status(500).json({ message: "사진 업로드 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// 설정 저장 (관리자)
router.put('/settings', async (req, res) => {
    let conn;
    try {
        const { background_image_url, theme_color } = req.body;
        conn = await pool.getConnection();

        if (background_image_url !== undefined) {
            await conn.query(
                "INSERT INTO settings (setting_key, setting_value) VALUES ('current_background', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
                [background_image_url, background_image_url]
            );
        }

        if (theme_color !== undefined) {
            await conn.query(
                "INSERT INTO user_settings (user_id, theme_color) VALUES (1, ?) ON DUPLICATE KEY UPDATE theme_color = ?",
                [theme_color, theme_color]
            );
        }

        res.json({ message: "설정이 저장되었습니다." });
    } catch (err) {
        console.error("Error saving settings:", err);
        res.status(500).json({ message: "설정 저장 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

// 대시보드 통계 (관리자)
router.get('/stats', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const [memos] = await conn.query("SELECT COUNT(*) as count FROM memos");
        const [videos] = await conn.query("SELECT COUNT(*) as count FROM videos");
        const [members] = await conn.query("SELECT COUNT(*) as count FROM members");

        // WordPress 게시글 수 가져오기
        let wpPosts = 0;
        try {
            const wpRes = await fetch('https://api.seongrim.o-r.kr/wp-json/wp/v2/posts?per_page=1');
            const totalHeader = wpRes.headers.get('X-WP-Total');
            wpPosts = totalHeader ? parseInt(totalHeader, 10) : 0;
        } catch (wpErr) {
            console.error('WP posts count fetch failed:', wpErr.message);
        }

        res.json({
            memos: memos.count,
            videos: videos.count,
            members: members.count,
            wpPosts,
        });
    } catch (err) {
        console.error("Error fetching admin stats:", err);
        res.status(500).json({ message: "통계 조회 중 오류 발생" });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;

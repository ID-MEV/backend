const express = require('express');
const { pool } = require('./db'); // db.js에서 pool을 가져옴

const router = express.Router();

// 메모 생성 (POST /api/memo)
router.post('/', async (req, res) => {
    let conn;
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: '메모 내용이 필요합니다.' });
        }

        conn = await pool.getConnection();
        const result = await conn.query(
            'INSERT INTO memos (content) VALUES (?)',
            [content]
        );

        // 새로 생성된 메모의 ID를 포함하여 응답
        res.status(201).json({
            id: result.insertId,
            content,
            created_at: new Date().toISOString() // 대략적인 생성 시간 (DB에서 가져오는 것이 더 정확)
        });
    } catch (err) {
        console.error('메모 생성 중 오류 발생:', err);
        res.status(500).json({ message: '메모 생성 중 서버 오류가 발생했습니다.' });
    } finally {
        if (conn) conn.release();
    }
});

// 모든 메모 조회 (GET /api/memo)
router.get('/', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const memos = await conn.query('SELECT id, content, created_at FROM memos ORDER BY id ASC');
        res.status(200).json(memos);
    } catch (err) {
        console.error('모든 메모 조회 중 오류 발생:', err);
        res.status(500).json({ message: '메모 조회 중 서버 오류가 발생했습니다.' });
    } finally {
        if (conn) conn.release();
    }
});

// 메모 삭제 (DELETE /api/memo/:id - 소프트 삭제)
router.delete('/:id', async (req, res) => {
    let conn;
    try {
        const { id } = req.params;

        conn = await pool.getConnection();

        // 1. memos 테이블에서 메모 조회
        const [memoToDelete] = await conn.query('SELECT id, content, created_at FROM memos WHERE id = ?', [id]);

        if (!memoToDelete) {
            return res.status(404).json({ message: '해당 ID의 메모를 찾을 수 없습니다.' });
        }

        // 2. memo_deleted 테이블에 삽입
        await conn.query(
            'INSERT INTO memo_deleted (id, content, created_at, deleted_at) VALUES (?, ?, ?, NOW())',
            [memoToDelete.id, memoToDelete.content, memoToDelete.created_at]
        );

        // 3. memos 테이블에서 메모 삭제
        await conn.query('DELETE FROM memos WHERE id = ?', [id]);

        res.status(200).json({ message: '메모가 성공적으로 삭제되었습니다.' });
    } catch (err) {
        console.error('메모 삭제 중 오류 발생:', err);
        res.status(500).json({ message: '메모 삭제 중 서버 오류가 발생했습니다.' });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;

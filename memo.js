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
            'INSERT INTO memos (content, isImportant) VALUES (?, ?)',
            [content, false] // isImportant를 명시적으로 false로 설정
        );

        // 새로 생성된 메모의 ID를 사용하여 데이터베이스에서 메모를 다시 가져옵니다.
        const [newlyCreatedMemo] = await conn.query(
            'SELECT id, content, created_at, isImportant FROM memos WHERE id = ?',
            [result.insertId]
        );

        if (!newlyCreatedMemo) {
            return res.status(500).json({ message: '새로 생성된 메모를 찾을 수 없습니다.' });
        }

        res.status(201).json(newlyCreatedMemo);
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
        const memos = await conn.query('SELECT id, content, created_at, isImportant FROM memos ORDER BY id ASC');
        res.status(200).json(memos);
    } catch (err) {
        console.error('모든 메모 조회 중 오류 발생:', err);
        res.status(500).json({ message: '메모 조회 중 서버 오류가 발생했습니다.' });
    } finally {
        if (conn) conn.release();
    }
});

// 메모 업데이트 (PUT /api/memo/:id)
router.put('/:id', async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { content, isImportant } = req.body; // content와 isImportant를 모두 받을 수 있도록

        if (content === undefined && isImportant === undefined) {
            return res.status(400).json({ message: '업데이트할 내용이 필요합니다.' });
        }

        conn = await pool.getConnection();
        let updateQuery = 'UPDATE memos SET ';
        const updateValues = [];
        const setClauses = [];

        if (content !== undefined) {
            setClauses.push('content = ?');
            updateValues.push(content);
        }
        if (isImportant !== undefined) {
            setClauses.push('isImportant = ?');
            updateValues.push(isImportant);
        }

        updateQuery += setClauses.join(', ') + ' WHERE id = ?';
        updateValues.push(id);

        const result = await conn.query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 ID의 메모를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '메모가 성공적으로 업데이트되었습니다.' });
    } catch (err) {
        console.error('메모 업데이트 중 오류 발생:', err);
        res.status(500).json({ message: '메모 업데이트 중 서버 오류가 발생했습니다.' });
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

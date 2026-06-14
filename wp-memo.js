const express = require('express');
const axios = require('axios');
const router = express.Router();

const WP_API_URL = process.env.WP_API_URL || 'https://api.seongrim.o-r.kr/wp-json/wp/v2';
const WP_APP_USER = process.env.WP_APP_USER;
const WP_APP_PASS = process.env.WP_APP_PASS;

const FREE_BOARD_CATEGORY_ID = 2;

const getAuthHeader = () => {
  const token = Buffer.from(`${WP_APP_USER}:${WP_APP_PASS}`).toString('base64');
  return { Authorization: `Basic ${token}` };
};

// GET /api/wp-memo — 게시글 목록 조회
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${WP_API_URL}/posts`, {
      params: {
        categories: FREE_BOARD_CATEGORY_ID,
        per_page: 100,
        orderby: 'date',
        order: 'desc',
        _fields: 'id,title,content,date',
      },
    });
    const posts = response.data.map(post => ({
      id: post.id,
      title: post.title?.rendered || '',
      content: post.content?.rendered || '',
      date: post.date,
    }));
    res.status(200).json(posts);
  } catch (err) {
    console.error('WP 자유게시판 조회 오류:', err.message);
    res.status(500).json({ message: 'WordPress 게시글 조회 중 오류가 발생했습니다.' });
  }
});

// POST /api/wp-memo — 새 게시글 등록
router.post('/', async (req, res) => {
  const { nickname, content } = req.body;
  if (!nickname || !content) {
    return res.status(400).json({ message: '닉네임과 내용이 필요합니다.' });
  }
  if (content.length > 300) {
    return res.status(400).json({ message: '내용은 300자 이하로 작성해 주세요.' });
  }
  try {
    const response = await axios.post(
      `${WP_API_URL}/posts`,
      {
        title: `[${nickname.trim()}]`,
        content: content.trim(),
        status: 'publish',
        categories: [FREE_BOARD_CATEGORY_ID],
      },
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(201).json({
      id: response.data.id,
      title: response.data.title?.rendered || '',
      content: response.data.content?.rendered || '',
      date: response.data.date,
    });
  } catch (err) {
    console.error('WP 게시글 작성 오류:', err.response?.data || err.message);
    res.status(500).json({ message: 'WordPress 게시글 작성 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/wp-memo/:id — 게시글 삭제
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await axios.delete(`${WP_API_URL}/posts/${id}`, {
      headers: getAuthHeader(),
    });
    res.status(200).json({ message: '게시글이 삭제되었습니다.' });
  } catch (err) {
    console.error('WP 게시글 삭제 오류:', err.response?.data || err.message);
    res.status(500).json({ message: 'WordPress 게시글 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;

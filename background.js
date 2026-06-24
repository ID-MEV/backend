const express = require('express');
const router = express.Router();
const { pool } = require('./db');

// GET endpoint to retrieve background setting
router.get('/background', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT setting_value FROM settings WHERE setting_key = ?", ['current_background']);
        if (result.length > 0) {
            res.json({ background_image_url: result[0].setting_value });
        } else {
            // If no background setting is found, return a default or an error
            res.status(404).json({ message: "Background setting not found" });
        }
    } catch (err) {
        console.error("Error fetching background setting:", err);
        res.status(500).json({ message: "Error fetching background setting" });
    } finally {
        if (conn) conn.release();
    }
});

// POST endpoint to update background setting (admin only)
router.post('/background', async (req, res) => {
    const { background_image_url } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        // Assuming 'current_background' is the key for the background image URL
        await conn.query("UPDATE settings SET setting_value = ? WHERE setting_key = ?", [background_image_url, 'current_background']);
        res.status(200).json({ message: "Background setting updated successfully" });
    } catch (err) {
        console.error("Error updating background setting:", err);
        res.status(500).json({ message: "Error updating background setting" });
    } finally {
        if (conn) conn.release();
    }
});

// GET endpoint to retrieve theme color setting
// (Assuming user_id is 1 for now, will be dynamic with authentication)
router.get('/theme', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT theme_color FROM user_settings WHERE user_id = ?", [1]);
        if (result.length > 0) {
            res.json({ theme_color: result[0].theme_color });
        } else {
            // If no setting is found for user_id 1, return default
            res.status(404).json({ message: "Theme setting not found for user_id 1" });
        }
    } catch (err) {
        console.error("Error fetching theme setting:", err);
        res.status(500).json({ message: "Error fetching theme setting" });
    } finally {
        if (conn) conn.release();
    }
});

// POST endpoint to update theme color setting
// (Assuming user_id is 1 for now, will be dynamic with authentication)
router.post('/theme', async (req, res) => {
    const { theme_color } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        // UPSERT logic: if user_id 1 exists, update; otherwise, insert.
        // For MariaDB, this is done with INSERT ... ON DUPLICATE KEY UPDATE
        await conn.query(
            "INSERT INTO user_settings (user_id, theme_color) VALUES (?, ?) ON DUPLICATE KEY UPDATE theme_color = ?",
            [1, theme_color, theme_color]
        );
        res.status(200).json({ message: "Theme setting updated successfully" });
    } catch (err) {
        console.error("Error updating theme setting:", err);
        res.status(500).json({ message: "Error updating theme setting" });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
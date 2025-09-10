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

// POST endpoint to update background setting
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

module.exports = router;
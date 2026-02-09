const express = require('express');
const router = express.Router();
const { pool } = require('./db');


/**
 * 사용자 날씨 설정을 조회하는 API
 * (현재는 user_id 1을 기본으로 사용)
 */
router.get('/settings', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const settings = await conn.query(
            "SELECT weather_location, weather_unit FROM user_settings WHERE user_id = 1"
        );
        if (settings.length > 0) {
            res.json(settings[0]);
        } else {
            res.status(404).json({ message: "User settings not found for user_id 1" });
        }
    } catch (err) {
        console.error("Error fetching weather settings:", err);
        res.status(500).json({ message: "Error fetching weather settings" });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * 사용자 날씨 설정을 업데이트하는 API
 * (현재는 user_id 1을 기본으로 사용)
 */
router.post('/settings', async (req, res) => {
    const { weather_location, weather_unit } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        let query = "UPDATE user_settings SET ";
        const params = [];
        const updates = [];

        if (weather_location !== undefined) {
            updates.push("weather_location = ?");
            params.push(weather_location);
        }
        if (weather_unit !== undefined) {
            updates.push("weather_unit = ?");
            params.push(weather_unit);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No settings provided for update" });
        }

        query += updates.join(", ") + " WHERE user_id = 1";
        
        const result = await conn.query(query, params);
        if (result.affectedRows > 0) {
            res.json({ message: "Weather settings updated successfully" });
        } else {
            res.status(200).json({ message: "No changes made or user settings not found for user_id 1" });
        }
    } catch (err) {
        console.error("Error updating weather settings:", err);
        res.status(500).json({ message: "Error updating weather settings" });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
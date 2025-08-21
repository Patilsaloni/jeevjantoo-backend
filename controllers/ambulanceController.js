// controllers/ambulancesController.js
const db = require('../db');

exports.getAmbulances = (req, res) => {
    const { q, city, area, userLat, userLng, radius = 10, page = 1, pageSize = 10 } = req.query;

    let sql = "SELECT *";
    let params = [];

    // Only calculate distance if coordinates provided
    if (userLat && userLng) {
        sql = "SELECT *, " +
            "(6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance";
        params.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
    }

    sql += " FROM ambulance WHERE 1=1";

    if (q) {
        sql += " AND name LIKE ?";
        params.push(`%${q}%`);
    }

    if (city) {
        sql += " AND city = ?";
        params.push(city);
    }

    if (area) {
        sql += " AND area = ?";
        params.push(area);
    }

    if (userLat && userLng) {
        sql += " HAVING distance <= ?";
        params.push(parseFloat(radius));
        sql += " ORDER BY distance ASC";
    }

    sql += " LIMIT ? OFFSET ?";
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            data: results
        });
    });
};


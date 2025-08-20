// controllers/ambulancesController.js
const db = require('../db');

exports.getAmbulances = (req, res) => {
    const { q, city, area, page = 1, pageSize = 10 } = req.query;

    let sql = "SELECT * FROM ambulance WHERE 1=1";
    let params = [];

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

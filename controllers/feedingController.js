const db = require('../db');

exports.getFeeding = (req, res) => {
    const { q, location, userLat, userLng, radius = 10, page = 1, pageSize = 10 } = req.query;
    let sql = "SELECT *";
    let params = [];

    if (userLat && userLng) {
        sql = "SELECT *, " +
            "(6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance";
        params.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
    }

    sql += " FROM feeding_food WHERE 1=1";

    if (q) {
        sql += " AND name LIKE ?";
        params.push(`%${q}%`);
    }
    if (location) {
        sql += " AND address LIKE ?";
        params.push(`%${location}%`);
    }

    if (userLat && userLng) {
        sql += " HAVING distance <= ?";
        params.push(parseFloat(radius));
        sql += " ORDER BY distance ASC";
    }

    const offset = (page - 1) * pageSize;
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        const data = results.map(r => ({
            ...r,
            individual: r.individual ? "Yes" : "No"
        }));

        res.json({
            page: Number(page),
            pageSize: Number(pageSize),
            data
        });
    });
};

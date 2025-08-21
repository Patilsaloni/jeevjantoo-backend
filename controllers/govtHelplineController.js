const db = require('../db');

exports.getGovtHelpline = (req, res) => {
    const { q, userLat, userLng, radius = 10, page = 1, pageSize = 10 } = req.query;

    let params = [];
    let sql = "SELECT *";

    // Calculate distance if coordinates are provided
    if (userLat && userLng) {
        sql = `
        SELECT *, 
        (6371 * acos(
            cos(radians(?)) * cos(radians(lat)) *
            cos(radians(lng) - radians(?)) +
            sin(radians(?)) * sin(radians(lat))
        )) AS distance 
        FROM govt_helpline 
        WHERE 1=1`;
        params.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
    } else {
        sql = "SELECT * FROM govt_helpline WHERE 1=1";
    }

    // Search by service
    if (q) {
        sql += " AND service LIKE ?";
        params.push(`%${q}%`);
    }

    // Filter by radius
    if (userLat && userLng) {
        sql += " HAVING distance <= ?";
        params.push(parseFloat(radius));
        sql += " ORDER BY distance ASC";
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching govt helpline:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            page: Number(page),
            pageSize: Number(pageSize),
            data: results
        });
    });
};

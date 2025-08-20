const db = require('../db');

exports.getBoardingSpa = (req, res) => {
    const { q, location, type, page = 1, pageSize = 10 } = req.query;

    let sql = "SELECT * FROM boarding_spa WHERE 1=1";
    let params = [];

    if (q) {
        sql += " AND name LIKE ?";
        params.push(`%${q}%`);
    }
    if (location) {
        sql += " AND location = ?";
        params.push(location);
    }
    if (type) {
        sql += " AND type = ?";
        params.push(type);
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching Boarding/Spa:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            page: Number(page),
            pageSize: Number(pageSize),
            total: results.length,
            data: results
        });
    });
};

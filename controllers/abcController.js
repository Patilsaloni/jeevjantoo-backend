const db = require('../db');

exports.getABC = (req, res) => {
    const { q, type, page = 1, pageSize = 10 } = req.query;

    let sql = "SELECT * FROM abc WHERE 1=1";
    let params = [];

    if (q) {
        sql += " AND location LIKE ?";
        params.push(`%${q}%`);
    }
    if (type) {
        sql += " AND type LIKE ?";
        params.push(`%${type}%`);
    }

    const offset = (page - 1) * pageSize;
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching ABC data:", err);
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

const db = require('../db');

exports.getFeeding = (req, res) => {
    const { q, location, page = 1, pageSize = 10 } = req.query;

    let sql = "SELECT * FROM feeding_food WHERE 1=1";
    let params = [];

    if (q) {
        sql += " AND name LIKE ?";
        params.push(`%${q}%`);
    }
    if (location) {
        sql += " AND address LIKE ?";
        params.push(`%${location}%`);
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching feeding data:", err);
            return res.status(500).json({ error: "Database error" });
        }

        // Convert individual from 0/1 to Yes/No
        const data = results.map(r => ({
            ...r,
            individual: r.individual ? "Yes" : "No"
        }));

        res.json({
            page: Number(page),
            pageSize: Number(pageSize),
            total: data.length,
            data
        });
    });
};

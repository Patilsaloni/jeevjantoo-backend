const db = require('../db');

exports.getNgos = (req, res) => {
    const { page = 1, pageSize = 10, city, q } = req.query;
    const offset = (page - 1) * pageSize;

    // Base query
    let sql = "SELECT * FROM ngos WHERE 1=1";
    let params = [];

    // Search by keyword (name or location)
    if (q) {
        sql += " AND (name LIKE ? OR location LIKE ?)";
        params.push(`%${q}%`, `%${q}%`);
    }

    // Filter by city (location)
    if (city) {
        sql += " AND location LIKE ?";
        params.push(`%${city}%`);
    }

    // Pagination
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching NGOs:", err);
            return res.status(500).json({ error: "Server error" });
        }

        res.json({
            page: Number(page),
            pageSize: Number(pageSize),
            data: results
        });
    });
};

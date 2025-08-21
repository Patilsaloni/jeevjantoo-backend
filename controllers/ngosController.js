const db = require('../db');

exports.getNgos = (req, res) => {
    const { page = 1, pageSize = 10, city, q, userLat, userLng, radius = 10 } = req.query;
    const offset = (page - 1) * pageSize;
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
        FROM ngos 
        WHERE 1=1`;
        params.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
    } else {
        sql = "SELECT * FROM ngos WHERE 1=1";
    }

    // Search/filter
    if (q) {
        sql += " AND (name LIKE ? OR location LIKE ?)";
        params.push(`%${q}%`, `%${q}%`);
    }
    if (city) {
        sql += " AND location LIKE ?";
        params.push(`%${city}%`);
    }

    // Distance filtering
    if (userLat && userLng) {
        sql += " HAVING distance <= ?";
        params.push(parseFloat(radius));
        sql += " ORDER BY distance ASC";
    }

    // Pagination
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching NGOs:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            page: Number(page),
            pageSize: Number(pageSize),
            data: results
        });
    });
};

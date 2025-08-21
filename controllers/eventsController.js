const db = require('../db');

exports.getEvents = (req, res) => {
    const { city, userLat, userLng, radius = 10, page = 1, pageSize = 5 } = req.query;
    let params = [];
    let sql = "SELECT *";

    // If user coordinates are provided, calculate distance
    if (userLat && userLng) {
        sql = `
            SELECT *, (
                6371 * acos(
                    cos(radians(?)) * cos(radians(lat)) *
                    cos(radians(lng) - radians(?)) +
                    sin(radians(?)) * sin(radians(lat))
                )
            ) AS distance
            FROM events WHERE 1=1
        `;
        params.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
    } else {
        sql = "SELECT * FROM events WHERE 1=1";
    }

    // Filter by city
    if (city) {
        sql += " AND place LIKE ?";
        params.push(`%${city}%`);
    }

    // Filter by radius if coordinates are provided
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
            console.error("Error fetching events:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            page: Number(page),
            pageSize: Number(pageSize),
            data: results
        });
    });
};

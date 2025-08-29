const { extractCity } = require("../utils/utils");
const db = require('../db');

exports.getClinics = (req, res) => {
    const { q, city, type, userLat, userLng, radius = 10, page = 1, pageSize = 10 } = req.query;

    let sql = "SELECT *";
    let params = [];

    // Only calculate distance if coordinates provided
 if (userLat && userLng) {
    sql = `SELECT *, 
        (6371 * acos(
            cos(radians(?)) * cos(radians(lat)) 
            * cos(radians(longitude) - radians(?)) 
            + sin(radians(?)) * sin(radians(lat))
        )) AS distance`;
    params.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
}




    sql += " FROM clinics WHERE status = 'active'";

    if (q) {
        sql += " AND name LIKE ?";
        params.push(`%${q}%`);
    }
    if (city) {
        sql += " AND city = ?";
        params.push(city);
    }
    if (type) {
        sql += " AND type = ?";
        params.push(type);
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
        if (err) return res.status(500).json({ error: err.message });

        const data = results.map(r => ({
            ...r,
            city: extractCity(r.address)
        }));

        res.json({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            data
        });
    });
};

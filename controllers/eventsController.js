const db = require('../db');

exports.getEvents = (req, res) => {
    const { city, page = 1, pageSize = 5 } = req.query;
    let sql = "SELECT * FROM events WHERE 1=1";

    if (city) {
        sql += ` AND city = ?`;
    }

    const values = [];
    if (city) values.push(city);

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            data: results
        });
    });
};

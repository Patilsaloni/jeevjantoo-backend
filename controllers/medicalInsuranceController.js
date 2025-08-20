const db = require('../db');

exports.getMedicalInsurance = (req, res) => {
    const { q, page = 1, pageSize = 10 } = req.query;
    let sql = "SELECT * FROM medical_insurance WHERE 1=1";
    let params = [];

    if(q) {
        sql += " AND provider LIKE ?";
        params.push(`%${q}%`);
    }

    const offset = (page - 1) * pageSize;
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if(err) {
            console.error("DB Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({ page: Number(page), pageSize: Number(pageSize), total: results.length, data: results });
    });
};

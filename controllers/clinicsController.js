const { extractCity } = require("../utils/utils");
const db = require('../db'); 

exports.getClinics = (req, res) => {
  const { q, city, type, page = 1, pageSize = 10 } = req.query;

 let sql = "SELECT * FROM clinics WHERE status = 'active'"; // Only show active clinics
let params = [];

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


  const offset = (page - 1) * pageSize;
sql += " LIMIT ? OFFSET ?";
params.push(Number(pageSize), offset);

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // ✅ Add city automatically
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

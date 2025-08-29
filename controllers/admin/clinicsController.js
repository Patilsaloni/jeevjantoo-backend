const db = require('../../db');
const { normalizeAddress } = require('../../utils/utils');
const { getCoordinatesFromAddress } = require('../../utils/googleMaps');

// GET /admin/clinics
exports.getClinics = (req, res) => {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const sql = `SELECT * FROM clinics ORDER BY id DESC LIMIT ? OFFSET ?`;
    db.query(sql, [Number(pageSize), offset], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ page: Number(page), pageSize: Number(pageSize), data: results });
    });
};

// POST /admin/clinics
exports.createClinic = async (req, res) => {
    try {
        let { name, city, type, address, timings, remark, status = "active" } = req.body;

        // Normalize address
        address = normalizeAddress(address);

        // Geocode address
        const coords = await getCoordinatesFromAddress(address);
        const lat = coords ? coords.lat : null;
        const longitude = coords ? coords.lng : null;

        const sql = `INSERT INTO clinics (name, city, type, address, timings, remark, lat, longitude, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [name, city, type, address, timings, remark, lat, longitude, status], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: "Clinic created successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// PUT /admin/clinics/:id
exports.updateClinic = async (req, res) => {
    try {
        const { id } = req.params;
        let { name, city, type, address, timings, remark, status } = req.body;

        // Normalize address
        address = normalizeAddress(address);

        // Geocode address
        const coords = await getCoordinatesFromAddress(address);
        const lat = coords ? coords.lat : null;
        const longitude = coords ? coords.lng : null;

        const sql = `UPDATE clinics 
                     SET name=?, city=?, type=?, address=?, timings=?, remark=?, lat=?, longitude=?, status=? 
                     WHERE id=?`;
        db.query(sql, [name, city, type, address, timings, remark, lat, longitude, status, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: `No clinic found with id ${id}` });
            }
            res.json({ message: "Clinic updated successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /admin/clinics/:id
exports.deleteClinic = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM clinics WHERE id=?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `No clinic found with id ${id}` });
        }
        res.json({ message: "Clinic deleted successfully" });
    });
};
const db = require('../../db');
const { normalizeAddress } = require('../../utils/utils');
const { getCoordinatesFromAddress } = require('../../utils/googleMaps');

// GET /admin/ngos
exports.getNgos = (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = "SELECT * FROM ngos WHERE 1=1";
    const params = [];
    if (status) {
        sql += " AND status=?";
        params.push(status);
    }
    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ page: Number(page), pageSize: Number(pageSize), data: results });
    });
};

// POST /admin/ngos
exports.createNgo = async (req, res) => {
    try {
        let { name, individual, location, contact, status = "active" } = req.body;
        location = normalizeAddress(location);
        const coords = await getCoordinatesFromAddress(location);
        const lat = coords ? coords.lat : 0.0;
        const lng = coords ? coords.lng : 0.0;

        const sql = "INSERT INTO ngos (name, individual, location, contact, lat, lng, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(sql, [name, individual, location, contact, lat, lng, status], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: "NGO created successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /admin/ngos/:id
exports.updateNgo = async (req, res) => {
    try {
        const { id } = req.params;
        let { name, individual, location, contact, status } = req.body;
        location = normalizeAddress(location);
        const coords = await getCoordinatesFromAddress(location);
        const lat = coords ? coords.lat : 0.0;
        const lng = coords ? coords.lng : 0.0;

        const sql = "UPDATE ngos SET name=?, individual=?, location=?, contact=?, lat=?, lng=?, status=? WHERE id=?";
        db.query(sql, [name, individual, location, contact, lat, lng, status, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: `No NGO found with id ${id}` });
            }
            res.json({ message: "NGO updated successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /admin/ngos/:id
exports.deleteNgo = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM ngos WHERE id=?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `No NGO found with id ${id}` });
        }
        res.json({ message: "NGO deleted successfully" });
    });
};

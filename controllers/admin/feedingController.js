const db = require('../../db');
const { normalizeAddress } = require('../../utils/utils');
const { getCoordinatesFromAddress } = require('../../utils/googleMaps');

// GET /admin/feeding?page=&pageSize=&status=
exports.getFeeding = (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = "SELECT * FROM feeding_food WHERE 1=1";
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

// GET /admin/feeding/:id
exports.getFeedingById = (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM feeding_food WHERE id=?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Feeding entry not found" });
        res.json(results[0]);
    });
};

// POST /admin/feeding
exports.createFeeding = async (req, res) => {
    try {
        let { name, individual, contact, address, status = "active" } = req.body;
        address = normalizeAddress(address);

        const coords = await getCoordinatesFromAddress(address);
        const lat = coords ? coords.lat : 0.0;
        const lng = coords ? coords.lng : 0.0;

        const sql = `INSERT INTO feeding_food (name, individual, contact, address, lat, lng, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [name, individual, contact, address, lat, lng, status], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: "Feeding entry created successfully" });
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /admin/feeding/:id
exports.updateFeeding = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if entry exists
        const checkSql = "SELECT * FROM feeding_food WHERE id=?";
        db.query(checkSql, [id], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: "Feeding entry not found" });

            let { name, individual, contact, address, status } = req.body;
            let lat = null, lng = null;
            if (address) {
                address = normalizeAddress(address);
                const coords = await getCoordinatesFromAddress(address);
                lat = coords ? coords.lat : null;
                lng = coords ? coords.lng : null;
            }

            const sql = `
                UPDATE feeding_food SET
                name = COALESCE(?, name),
                individual = COALESCE(?, individual),
                contact = COALESCE(?, contact),
                address = COALESCE(?, address),
                lat = COALESCE(?, lat),
                lng = COALESCE(?, lng),
                status = COALESCE(?, status)
                WHERE id=?`;

            db.query(sql, [name, individual, contact, address, lat, lng, status, id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Feeding entry updated successfully" });
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /admin/feeding/:id
exports.deleteFeeding = (req, res) => {
    const { id } = req.params;

    const checkSql = "SELECT * FROM feeding_food WHERE id=?";
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Feeding entry not found" });

        const sql = "DELETE FROM feeding_food WHERE id=?";
        db.query(sql, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Feeding entry deleted successfully" });
        });
    });
};

const db = require('../../db');
const { normalizeAddress } = require('../../utils/utils');
const { getCoordinatesFromAddress } = require('../../utils/googleMaps');

// GET all govt helplines with pagination
exports.getHelplines = (req, res) => {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const sql = `SELECT * FROM govt_helpline ORDER BY id DESC LIMIT ? OFFSET ?`;
    db.query(sql, [Number(pageSize), offset], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ page: Number(page), pageSize: Number(pageSize), data: results });
    });
};

// GET helpline by ID
exports.getHelplineById = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM govt_helpline WHERE id=?`;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Govt Helpline not found" });
        res.json(results[0]);
    });
};

// CREATE new helpline
exports.createHelpline = async (req, res) => {
    try {
        let { service, contact, governing_body, remark, location } = req.body;

        let lat = 0.0, lng = 0.0;
        if (location) {
            const coords = await getCoordinatesFromAddress(normalizeAddress(location));
            lat = coords ? coords.lat : 0.0;
            lng = coords ? coords.lng : 0.0;
        }

        const sql = `INSERT INTO govt_helpline (service, contact, governing_body, remark, lat, lng) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(sql, [service, contact, governing_body, remark, lat, lng], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: "Govt Helpline created successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE helpline by ID
exports.updateHelpline = async (req, res) => {
    try {
        const { id } = req.params;
        const { service, contact, governing_body, remark, location } = req.body;

        // Check if ID exists
        const checkSql = `SELECT * FROM govt_helpline WHERE id=?`;
        db.query(checkSql, [id], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: "Govt Helpline not found" });

            let lat = results[0].lat;
            let lng = results[0].lng;

            if (location) {
                const coords = await getCoordinatesFromAddress(normalizeAddress(location));
                lat = coords ? coords.lat : lat;
                lng = coords ? coords.lng : lng;
            }

            const sql = `
                UPDATE govt_helpline SET
                service = COALESCE(?, service),
                contact = COALESCE(?, contact),
                governing_body = COALESCE(?, governing_body),
                remark = COALESCE(?, remark),
                lat = COALESCE(?, lat),
                lng = COALESCE(?, lng)
                WHERE id=?`;

            db.query(sql, [service, contact, governing_body, remark, lat, lng, id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Govt Helpline updated successfully" });
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE helpline by ID
exports.deleteHelpline = (req, res) => {
    const { id } = req.params;

    const checkSql = `SELECT * FROM govt_helpline WHERE id=?`;
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Govt Helpline not found" });

        const sql = `DELETE FROM govt_helpline WHERE id=?`;
        db.query(sql, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Govt Helpline deleted successfully" });
        });
    });
};

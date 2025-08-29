const db = require('../../db');
const { normalizeAddress } = require('../../utils/utils');
const { getCoordinatesFromAddress } = require('../../utils/googleMaps');

// GET /admin/boarding-spa
exports.getBoardingSpa = (req, res) => {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const sql = "SELECT * FROM boarding_spa ORDER BY id DESC LIMIT ? OFFSET ?";
    db.query(sql, [Number(pageSize), offset], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ page: Number(page), pageSize: Number(pageSize), data: results });
    });
};

// POST /admin/boarding-spa
exports.createBoardingSpa = async (req, res) => {
    try {
        let { name, contact, location, working_hours } = req.body;
        location = normalizeAddress(location);
        const coords = await getCoordinatesFromAddress(location);
        const lat = coords ? coords.lat : 0.0;
        const lng = coords ? coords.lng : 0.0;

        const sql = `
            INSERT INTO boarding_spa (name, contact, location, working_hours, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(sql, [name, contact, location, working_hours, lat, lng], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: "Boarding/Spa created successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /admin/boarding-spa/:id
exports.updateBoardingSpa = async (req, res) => {
    try {
        const { id } = req.params;
        let { name, contact, location, working_hours } = req.body;

        let lat = null, lng = null;
        let normalizedLocation = location;
        if (location) {
            normalizedLocation = normalizeAddress(location);
            const coords = await getCoordinatesFromAddress(normalizedLocation);
            lat = coords ? coords.lat : null;
            lng = coords ? coords.lng : null;
        }

        const sql = `
            UPDATE boarding_spa SET
            name = COALESCE(?, name),
            contact = COALESCE(?, contact),
            location = COALESCE(?, location),
            working_hours = COALESCE(?, working_hours),
            lat = COALESCE(?, lat),
            lng = COALESCE(?, lng)
            WHERE id = ?`;

        db.query(sql, [name, contact, normalizedLocation, working_hours, lat, lng, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            // Check if any row was affected
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Boarding/Spa with this ID does not exist" });
            }

            res.json({ message: "Boarding/Spa updated successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// DELETE /admin/boarding-spa/:id
exports.deleteBoardingSpa = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM boarding_spa WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Check if any row was affected
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Boarding/Spa with this ID does not exist" });
        }

        res.json({ message: "Boarding/Spa deleted successfully" });
    });
};


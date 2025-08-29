const db = require('../../db');
const { normalizeAddress } = require('../../utils/utils');
const { getCoordinatesFromAddress } = require('../../utils/googleMaps');

// GET /admin/medical-insurance?page=&pageSize=&status=
exports.getMedicalInsurance = (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = "SELECT * FROM medical_insurance WHERE 1=1";
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

// GET /admin/medical-insurance/:id
exports.getMedicalInsuranceById = (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM medical_insurance WHERE id=?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Medical Insurance not found" });
        res.json(results[0]);
    });
};

// POST /admin/medical-insurance
exports.createMedicalInsurance = async (req, res) => {
    try {
        let { provider, coverage, link, address, status = "active" } = req.body;

        if (!provider || !address) {
            return res.status(400).json({ error: "Provider and address are required" });
        }

        address = normalizeAddress(address);
        const coords = await getCoordinatesFromAddress(address);
        const lat = coords ? coords.lat : null;
        const lng = coords ? coords.lng : null;

        const sql = `
            INSERT INTO medical_insurance (provider, coverage, link, address, lat, lng, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [provider, coverage, link, address, lat, lng, status], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: "Medical Insurance created successfully" });
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /admin/medical-insurance/:id
exports.updateMedicalInsurance = async (req, res) => {
    try {
        const { id } = req.params;

        const checkSql = "SELECT * FROM medical_insurance WHERE id=?";
        db.query(checkSql, [id], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: "Medical Insurance not found" });

            let { provider, coverage, link, address, status } = req.body;
            let lat = null, lng = null;

            if (address) {
                address = normalizeAddress(address);
                const coords = await getCoordinatesFromAddress(address);
                lat = coords ? coords.lat : null;
                lng = coords ? coords.lng : null;
            }

            const sql = `
                UPDATE medical_insurance SET
                provider = COALESCE(?, provider),
                coverage = COALESCE(?, coverage),
                link = COALESCE(?, link),
                address = COALESCE(?, address),
                lat = COALESCE(?, lat),
                lng = COALESCE(?, lng),
                status = COALESCE(?, status)
                WHERE id=?
            `;

            db.query(sql, [provider, coverage, link, address, lat, lng, status, id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Medical Insurance updated successfully" });
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /admin/medical-insurance/:id
exports.deleteMedicalInsurance = (req, res) => {
    const { id } = req.params;

    const checkSql = "SELECT * FROM medical_insurance WHERE id=?";
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Medical Insurance not found" });

        const sql = "DELETE FROM medical_insurance WHERE id=?";
        db.query(sql, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Medical Insurance deleted successfully" });
        });
    });
};

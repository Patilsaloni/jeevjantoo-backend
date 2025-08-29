const db = require('../../db');
const { normalizeAddress } = require('../../utils/utils');
const { getCoordinatesFromAddress } = require('../../utils/googleMaps');

// GET all ABCs
exports.getABC = (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = "SELECT * FROM abc WHERE 1=1";
    const params = [];
    if (status) {
        sql += " AND status = ?";
        params.push(status);
    }
    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(Number(pageSize), offset);

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ page: Number(page), pageSize: Number(pageSize), data: results });
    });
};

// GET ABC by ID
exports.getABCById = (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM abc WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "ABC not found" });
        res.json(results[0]);
    });
};

// CREATE ABC
exports.createABC = (req, res) => {
    let { location, type, person_incharge, contact, remark, status = "active" } = req.body;
    const sql = "INSERT INTO abc (location, type, person_incharge, contact, remark, status) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [location, type, person_incharge, contact, remark, status], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, message: "ABC created successfully" });
    });
};

// UPDATE ABC (partial updates allowed)
exports.updateABC = (req, res) => {
    const { id } = req.params;
    let { location, type, person_incharge, contact, remark, status } = req.body;

    const sql = `
        UPDATE abc SET
        location = COALESCE(?, location),
        type = COALESCE(?, type),
        person_incharge = COALESCE(?, person_incharge),
        contact = COALESCE(?, contact),
        remark = COALESCE(?, remark),
        status = COALESCE(?, status)
        WHERE id = ?
    `;
    db.query(sql, [location, type, person_incharge, contact, remark, status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "ABC not found" });
        res.json({ message: "ABC updated successfully" });
    });
};

// DELETE ABC
exports.deleteABC = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM abc WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "ABC not found" });
        res.json({ message: "ABC deleted successfully" });
    });
};
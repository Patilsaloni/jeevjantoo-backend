const db = require("../db");
const util = require("util");
const query = util.promisify(db.query).bind(db);

// Create a user report
exports.createReport = async (req, res) => {
    try {
        const { type, id } = req.params;   // type = clinics, ngos, etc.
        const { comment } = req.body;
        const userId = req.user?.id || 0;  // get user id if logged in, else 0

        // Insert into directory_reports
        const sql = `INSERT INTO directory_reports (directory_type, item_id, reported_by_user_id, comment) VALUES (?, ?, ?, ?)`;
        const result = await query(sql, [type, id, userId, comment || null]);

        // Optional: increment report_count in the directory table
        await query(`UPDATE ${type} SET report_count = report_count + 1 WHERE id = ?`, [id]);

        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            report_id: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

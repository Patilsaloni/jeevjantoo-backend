const db = require("../../db");
const util = require("util");
const query = util.promisify(db.query).bind(db);

// =====================
// Admin: Get all reports
// =====================
exports.getReports = async (req, res) => {
    try {
        const { status, type } = req.query;
        let sql = "SELECT * FROM directory_reports WHERE 1=1";
        let params = [];
        if (status) { sql += " AND status = ?"; params.push(status); }
        if (type) { sql += " AND directory_type = ?"; params.push(type); }

        const reports = await query(sql, params);
        res.json({ data: reports });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// =====================
// Admin: Handle a report
// =====================
exports.handleReport = async (req, res) => {
    try {
        const { id } = req.params; // report_id
        const { action, resolution_comment } = req.body; // action = "reviewed" | "action_taken"

        if (!["reviewed", "action_taken"].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }

        const sql = `
            UPDATE directory_reports
            SET status = ?, resolution_comment = ?
            WHERE id = ?
        `;
        await query(sql, [action, resolution_comment || null, id]);

        res.json({ success: true, message: "Report updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

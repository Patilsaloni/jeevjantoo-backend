const db = require("../../db");
const util = require("util");
const query = util.promisify(db.query).bind(db);

// ---------------- Get all adoptions (with optional filters) ----------------
exports.getAllAdoptions = async (req, res) => {
  try {
    let { status, city, species } = req.query;
    let sql = "SELECT * FROM adoptions WHERE 1=1";
    let params = [];

    if (status) { sql += " AND status = ?"; params.push(status); }
    if (city) { sql += " AND city = ?"; params.push(city); }
    if (species) { sql += " AND species = ?"; params.push(species); }

    sql += " ORDER BY created_at DESC";

    const adoptions = await query(sql, params);
    res.json({ data: adoptions });
  } catch (err) {
    console.error("Get all adoptions error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ---------------- Approve or Reject Adoption ----------------
exports.approveOrRejectAdoption = async (req, res) => {
  try {
    const { id, action } = req.params;
    const adminId = req.user.id;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const adoptions = await query("SELECT * FROM adoptions WHERE id = ?", [id]);
    if (adoptions.length === 0) return res.status(404).json({ error: "Adoption not found" });

    const adoption = adoptions[0];

    if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
}


    const status = action === "approve" ? "approved" : "rejected";
    await query("UPDATE adoptions SET status = ? WHERE id = ?", [status, id]);

    // Mark related reports as resolved
    await query(
      "UPDATE reports SET resolved_by_admin_id = ?, resolved_at = NOW(), resolution_comment = ? WHERE type='adoption' AND reference_id=? AND resolved_at IS NULL",
      [adminId, `Adoption ${status}`, id]
    );

    res.json({ message: `Adoption ${status} successfully`, adoption: { ...adoption, status } });
  } catch (err) {
    console.error("Approve/Reject Adoption error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ---------------- Mark Adoption as Adopted ----------------
exports.markAsAdopted = async (req, res) => {
  try {
    const { id } = req.params;

    const adoptions = await query("SELECT * FROM adoptions WHERE id = ?", [id]);
    if (adoptions.length === 0) return res.status(404).json({ error: "Adoption not found" });

    await query("UPDATE adoptions SET status = 'adopted' WHERE id = ?", [id]);
    res.json({ message: "Adoption marked as adopted" });
  } catch (err) {
    console.error("Mark as adopted error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ---------------- Delete Adoption ----------------
exports.deleteAdoption = async (req, res) => {
  try {
    const { id } = req.params;

    const adoptions = await query("SELECT * FROM adoptions WHERE id = ?", [id]);
    if (adoptions.length === 0) return res.status(404).json({ error: "Adoption not found" });

    await query("DELETE FROM adoptions WHERE id = ?", [id]);
    res.json({ message: "Adoption deleted successfully" });
  } catch (err) {
    console.error("Delete adoption error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ---------------- Get Moderation Queue ----------------
exports.getModerationQueue = async (req, res) => {
  try {
    const adoptions = await query("SELECT * FROM adoptions WHERE status = 'pending' ORDER BY created_at DESC");
    res.json({ pendingAdoptions: adoptions });
  } catch (err) {
    console.error("Get Moderation Queue error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// Get adoption reports for moderation
exports.getReports = async (req, res) => {
    try {
        const { status } = req.query;
        let sql = "SELECT * FROM adoption_reports WHERE 1=1";
        const params = [];
        if (status) { sql += " AND status = ?"; params.push(status); }

        const reports = await query(sql, params);
        res.json({ data: reports });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// Handle a report (approve/reject)
exports.handleReport = async (req, res) => {
    try {
        const { id } = req.params; // report ID
        const { action, resolution_comment } = req.body;
        const adminId = req.user.id;

        if (!["reviewed", "action_taken"].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }

        // Update report
        await query(
            `UPDATE adoption_reports 
             SET status = ?, resolved_by_admin_id = ?, resolved_at = NOW(), resolution_comment = ? 
             WHERE id = ?`,
            [action, adminId, resolution_comment || null, id]
        );

        // Optionally hide post if action_taken
        if (action === "action_taken") {
            const post = await query("SELECT post_id FROM adoption_reports WHERE id = ?", [id]);
            if (post.length) {
                await query("UPDATE adoptions SET status = 'inactive' WHERE id = ?", [post[0].post_id]);
            }
        }

        // Optional: notify reporter or post owner (implement notification logic here)

        res.json({ success: true, message: "Report handled successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

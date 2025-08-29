const db = require('../db');
const { getCoordinatesFromAddress } = require("../utils/googleMaps");
const util = require("util");
const query = util.promisify(db.query).bind(db);

const MAX_REPORTS_PER_DAY = 5;
// ---------------- Get all adoption posts ----------------
exports.getAdoptions = async (req, res) => {
    try {
        let {
            page = 1, limit = 10, species, city, vaccinated, gender,
            age_min, age_max, userLat, userLng, radius = 10, status
        } = req.query;

        page = Number(page);
        limit = Number(limit);
        const offset = (page - 1) * limit;

        let params = [];
        let sql = `SELECT id, pet_name, species, gender, age_value, age_unit, vaccinated, dewormed, neutered, temperament, friendly_with_kids, trained, special_needs, city, area, lat, lng, photos, video, status, owner_user_id`;

        if (userLat && userLng) {
            sql += `, (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(lat)) *
                    COS(RADIANS(lng) - RADIANS(?)) +
                    SIN(RADIANS(?)) * SIN(RADIANS(lat)))) AS distance`;
            params.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
        }

        sql += " FROM adoptions WHERE 1=1";

        if (status) params.push(status) && (sql += " AND status = ?");
        if (species) params.push(species) && (sql += " AND species = ?");
        if (city) params.push(city) && (sql += " AND city = ?");
        if (vaccinated !== undefined) params.push(vaccinated ? 1 : 0) && (sql += " AND vaccinated = ?");
        if (gender) params.push(gender) && (sql += " AND gender = ?");
        if (age_min) params.push(age_min) && (sql += " AND age_value >= ?");
        if (age_max) params.push(age_max) && (sql += " AND age_value <= ?");

        if (userLat && userLng) {
            sql += " HAVING distance <= ? ORDER BY distance ASC";
            params.push(Number(radius));
        } else sql += " ORDER BY created_at DESC";

        sql += " LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const results = await query(sql, params);
        const formattedResults = results.map(row => {
            if (row.photos) {
                try { row.photos = JSON.parse(row.photos); } catch { row.photos = []; }
            }
            ["vaccinated","dewormed","neutered","friendly_with_kids","trained","special_needs"].forEach(f => row[f] = row[f] === 1);
            if (row.temperament) try { row.temperament = JSON.parse(row.temperament); } catch {}
            return row;
        });

        // Total count
        let countSql = "SELECT COUNT(*) as total FROM adoptions WHERE 1=1";
        let countParams = [];
        if (status) countSql += " AND status = ?" && countParams.push(status);
        if (species) countSql += " AND species = ?" && countParams.push(species);
        if (city) countSql += " AND city = ?" && countParams.push(city);
        if (vaccinated !== undefined) countSql += " AND vaccinated = ?" && countParams.push(vaccinated ? 1 : 0);
        if (gender) countSql += " AND gender = ?" && countParams.push(gender);
        if (age_min) countSql += " AND age_value >= ?" && countParams.push(age_min);
        if (age_max) countSql += " AND age_value <= ?" && countParams.push(age_max);

        const countResult = await query(countSql, countParams);
        const total = countResult[0]?.total || 0;

        res.json({ page, limit, total, data: formattedResults });
    } catch (err) {
        console.error("Get Adoptions error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---------------- Get adoption by ID ----------------
exports.getAdoptionById = async (req, res) => {
    try {
        const { id } = req.params;
        const results = await query("SELECT * FROM adoptions WHERE id = ?", [id]);
        if (!results.length) return res.status(404).json({ error: "Adoption post not found" });

        const row = results[0];
        if (row.photos) try { row.photos = JSON.parse(row.photos); } catch { row.photos = []; }
        ["vaccinated","dewormed","neutered","friendly_with_kids","trained","special_needs"].forEach(f => row[f] = row[f] === 1);
        if (row.temperament) try { row.temperament = JSON.parse(row.temperament); } catch {}

        res.json(row);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---------------- Create adoption ----------------
exports.createAdoption = async (req, res) => {
    try {
        const {
            pet_name, species, gender, age_value, age_unit,
            vaccinated, dewormed, neutered, temperament,
            friendly_with_kids, trained, special_needs,
            city, area, address, photos, video, status
        } = req.body;

        if (!species || !pet_name || !city || !address) return res.status(400).json({ error: "species, pet_name, city, address required" });

        const coordinates = await getCoordinatesFromAddress(address);
        if (!coordinates) return res.status(400).json({ error: "Invalid address" });

        const lat = coordinates.lat;
        const lng = coordinates.lng;
        const owner_user_id = req.user?.id;

        const sql = `INSERT INTO adoptions
        (species, pet_name, gender, age_value, age_unit, vaccinated, dewormed, neutered, temperament, friendly_with_kids, trained, special_needs, city, area, address, lat, lng, photos, video, owner_user_id, status, is_reviewed, report_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`;

        const params = [
            species, pet_name, gender || null, age_value || null, age_unit || null,
            vaccinated ? 1 : 0, dewormed ? 1 : 0, neutered ? 1 : 0,
            temperament ? JSON.stringify(temperament) : null,
            friendly_with_kids ? 1 : 0,
            trained ? 1 : 0,
            special_needs ? 1 : 0,
            city, area || null, address, lat, lng,
            photos ? JSON.stringify(photos) : null,
            video || null, owner_user_id, status || "pending"
        ];

        const result = await query(sql, params);
        res.status(201).json({ message: "Adoption post created", id: result.insertId, lat, lng });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---------------- Update adoption ----------------
exports.updateAdoption = async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;

        const [post] = await query("SELECT owner_user_id FROM adoptions WHERE id = ?", [id]);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.owner_user_id !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

        if (updates.address && (!updates.lat || !updates.lng)) {
            const coords = await getCoordinatesFromAddress(updates.address);
            if (coords) { updates.lat = coords.lat; updates.lng = coords.lng; }
        }

        const fields = [];
        const values = [];
        for (let key in updates) {
            if (updates[key] !== undefined) {
                if (["friendly_with_kids","trained","special_needs","vaccinated","dewormed","neutered"].includes(key)) {
                    values.push(updates[key] ? 1 : 0);
                } else if (key === "temperament" && updates[key]) {
                    values.push(JSON.stringify(updates[key]));
                } else {
                    values.push(updates[key]);
                }
                fields.push(`${key}=?`);
            }
        }
        if (!fields.length) return res.status(400).json({ error: "No valid fields to update" });

        values.push(id);
        await query(`UPDATE adoptions SET ${fields.join(',')}, updated_at=NOW() WHERE id=?`, values);
        res.json({ message: "Adoption post updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---------------- Delete adoption ----------------
exports.deleteAdoption = async (req, res) => {
    try {
        const id = req.params.id;
        await query("DELETE FROM inquiries WHERE adoption_id=?", [id]);
        const result = await query("DELETE FROM adoptions WHERE id=?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Post not found" });
        res.json({ message: "Adoption post deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---------------- Create inquiry ----------------
exports.createInquiry = async (req, res) => {
    try {
        const adoptionId = Number(req.params.id);
        const { name, contact, message } = req.body;
        if (!adoptionId || !name?.trim() || !contact?.trim() || !message?.trim()) return res.status(400).json({ error: "All fields are required" });

        const adoptionExists = await query("SELECT id FROM adoptions WHERE id = ?", [adoptionId]);
        if (!adoptionExists.length) return res.status(404).json({ error: "Adoption post not found" });

        const sql = "INSERT INTO inquiries (adoption_id, name, contact, message) VALUES (?, ?, ?, ?)";
        const result = await query(sql, [adoptionId, name.trim(), contact.trim(), message.trim()]);
        res.status(201).json({ message: "Inquiry sent successfully", id: result.insertId });
    } catch (err) {
        console.error("Create Inquiry Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---------------- Get inquiries ----------------
exports.getInquiries = async (req, res) => {
    try {
        const adoptionId = req.params.id;
        const userId = req.user.id;

        const adoption = await query("SELECT owner_user_id FROM adoptions WHERE id = ?", [adoptionId]);
        if (!adoption.length) return res.status(404).json({ error: "Adoption post not found" });

        const ownerId = adoption[0].owner_user_id;
        if (userId !== ownerId && !req.user.isAdmin) return res.status(403).json({ error: "Not authorized to view inquiries" });

        const results = await query("SELECT id, name, contact, message, created_at FROM inquiries WHERE adoption_id = ?", [adoptionId]);
        res.json({ adoptionId, total: results.length, inquiries: results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---------------- Mark as adopted ----------------
exports.markAdopted = async (req, res) => {
    try {
        const id = req.params.id;
        await query("UPDATE adoptions SET status='adopted' WHERE id=?", [id]);
        res.json({ message: "Marked as adopted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---------------- Report adoption ----------------
exports.reportAdoption = async (req, res) => {
    try {
        const { id } = req.params;        // adoption post id
        const { comment } = req.body;
        const userId = req.user?.id || 0;

        // Fetch adoption post
        const [post] = await query("SELECT id, status FROM adoptions WHERE id = ?", [id]);

        // Allow reporting only if post is active or approved
        if (!post || (post.status !== "active" && post.status !== "approved")) {
            return res.status(400).json({ 
                error: "Report can only be created for posts that are active or approved." 
            });
        }

        // Insert report into adoption_reports
        const sql = `INSERT INTO adoption_reports 
                     (post_id, reported_by_user_id, comment) 
                     VALUES (?, ?, ?)`;
        const result = await query(sql, [id, userId, comment || null]);

        // Increment report_count in adoption post table
        await query("UPDATE adoptions SET report_count = report_count + 1 WHERE id = ?", [id]);

        res.status(201).json({
            success: true,
            message: "Adoption listing reported",
            report_id: result.insertId
        });
    } catch (err) {
        console.error("Error reporting adoption:", err);
        res.status(500).json({ error: "Server error" });
    }
};
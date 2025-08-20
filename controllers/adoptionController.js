    const db = require('../db');

 // 1️⃣ Get all adoption posts with optional filters + pagination
exports.getAdoptions = (req, res) => {
    let { page = 1, limit = 10, species, city, status, gender, vaccinated, dewormed, neutered, age_min, age_max } = req.query;

    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    let filterSql = "WHERE 1=1"; // base filter
    const params = [];

    // Species filter
    if (species) {
        filterSql += " AND species = ?";
        params.push(species);
    }

    // City filter
    if (city) {
        filterSql += " AND city = ?";
        params.push(city);
    }

    // Status filter
    if (status) {
        filterSql += " AND status = ?";
        params.push(status);
    }

    // Gender filter
    if (gender) {
        filterSql += " AND gender = ?";
        params.push(gender);
    }

    // Vaccinated, dewormed, neutered filters (convert string to 0/1)
    if (vaccinated !== undefined) {
        filterSql += " AND vaccinated = ?";
        params.push(vaccinated === 'true' ? 1 : 0);
    }
    if (dewormed !== undefined) {
        filterSql += " AND dewormed = ?";
        params.push(dewormed === 'true' ? 1 : 0);
    }
    if (neutered !== undefined) {
        filterSql += " AND neutered = ?";
        params.push(neutered === 'true' ? 1 : 0);
    }

    // Age range filter
    if (age_min !== undefined) {
        filterSql += " AND age_value >= ?";
        params.push(Number(age_min));
    }
    if (age_max !== undefined) {
        filterSql += " AND age_value <= ?";
        params.push(Number(age_max));
    }

    // Count total records for pagination
    const countSql = `SELECT COUNT(*) AS total FROM adoptions ${filterSql}`;
    db.query(countSql, params, (err, countResult) => {
        if (err) return res.status(500).json({ error: "Database error", details: err });

        const totalCount = countResult[0].total;

        // Main query with pagination
        const sql = `
            SELECT * FROM adoptions
            ${filterSql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        db.query(sql, [...params, limit, offset], (err, results) => {
            if (err) return res.status(500).json({ error: "Database error", details: err });

            // Convert photos JSON to array & 0/1 to true/false
            results.forEach(row => {
                if (row.photos) {
                    try {
                        row.photos = JSON.parse(row.photos);
                    } catch (e) {
                        row.photos = [];
                    }
                }
                row.vaccinated = row.vaccinated === 1;
                row.dewormed = row.dewormed === 1;
                row.neutered = row.neutered === 1;
            });

            res.json({
                page,
                limit,
                totalCount,
                data: results
            });
        });
    });
}; 


// 2️⃣ Get single adoption post by ID
exports.getAdoptionById = (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM adoptions WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error", details: err });
        if (!results.length) return res.status(404).json({ error: "Adoption post not found" });

        const row = results[0];

        // Convert photos JSON to array
        if (row.photos) {
            try {
                row.photos = JSON.parse(row.photos);
            } catch (e) {
                row.photos = [];
            }
        }

        // Convert 0/1 to true/false
        row.vaccinated = row.vaccinated === 1;
        row.dewormed = row.dewormed === 1;
        row.neutered = row.neutered === 1;

        res.json(row);
    });
};

// 3️⃣ Create adoption post
exports.createAdoption = (req, res) => {
    let {
        species, pet_name, gender, age_value, age_unit,
        vaccinated, dewormed, neutered, temperament,
        city, area, lat, lng, photos, video,
        owner_user_id, status
    } = req.body;

    if (!species || !owner_user_id) 
        return res.status(400).json({ error: "species and owner_user_id are required" });

    // Ensure numeric fields are valid
    age_value = age_value ? Number(age_value) : null;
    lat = lat ? Number(lat) : null;
    lng = lng ? Number(lng) : null;

    const sql = `
        INSERT INTO adoptions 
        (species, pet_name, gender, age_value, age_unit, vaccinated, dewormed, neutered, temperament, city, area, lat, lng, photos, video, owner_user_id, status, is_reviewed, report_count) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `;
    const params = [
        species.trim(), pet_name ? pet_name.trim() : null, gender ? gender.trim() : null,
        age_value, age_unit ? age_unit.trim() : null,
        vaccinated ? 1 : 0, dewormed ? 1 : 0, neutered ? 1 : 0,
        temperament ? temperament.trim() : null,
        city ? city.trim() : null, area ? area.trim() : null,
        lat, lng,
        photos ? JSON.stringify(photos) : null, video ? video.trim() : null,
        owner_user_id, status ? status.trim() : "pending"
    ];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
        res.json({ message: "Adoption post created", id: result.insertId });
    });
};




// 4️⃣ Update adoption post
exports.updateAdoption = (req, res) => {
    const id = req.params.id;
    const { status, photos } = req.body;
    const photosJson = photos ? JSON.stringify(photos) : null;

    const query = `UPDATE adoptions SET status = ?, photos = ?, updated_at = NOW() WHERE id = ?`;
    db.query(query, [status, photosJson, id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Adoption post not found" });
        res.json({ message: "Adoption post updated successfully" });
    });
};

// 5️⃣ Delete adoption post
exports.deleteAdoption = (req, res) => {
    const id = req.params.id;

    // First delete related inquiries (if any)
    db.query("DELETE FROM inquiries WHERE adoption_id = ?", [id], (err) => {
        if (err) {
            console.error("DB Error (inquiries):", err);
            return res.status(500).json({ error: "Database error deleting inquiries", details: err });
        }

        // Now delete the adoption post
        db.query("DELETE FROM adoptions WHERE id = ?", [id], (err, result) => {
            if (err) {
                console.error("DB Error (adoptions):", err);
                return res.status(500).json({ error: "Database error deleting adoption post", details: err });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Adoption post not found" });
            }

            res.json({ message: "Adoption post deleted successfully" });
        });
    });
};



// 6️⃣ Create inquiry for a post
exports.createInquiry = (req, res) => {
    const adoptionId = Number(req.params.id); // ensure numeric
    const { name, contact, message } = req.body;

    // 1️⃣ Validate required fields
    if (!adoptionId || !name || !contact || !message) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // 2️⃣ Prepare SQL
    const sql = `
        INSERT INTO inquiries (adoption_id, name, contact, message) 
        VALUES (?, ?, ?, ?)
    `;

    const params = [
        adoptionId,
        name.trim(),
        contact.trim(),
        message.trim()
    ];

    // 3️⃣ Execute query
    db.query(sql, params, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err.sqlMessage });
        }
        res.json({ message: "Inquiry created successfully", id: result.insertId });
    });
};



// 7️⃣ Mark post as adopted
exports.markAdopted = (req, res) => {
    const postId = Number(req.params.id);

    if (!postId) {
        return res.status(400).json({ error: "Invalid adoption ID" });
    }

    const sql = "UPDATE adoptions SET status = 'adopted' WHERE id = ?";

    db.query(sql, [postId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err.sqlMessage });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Adoption post not found" });
        }

        res.json({ message: "Post marked as adopted" });
    });
};


// 8️⃣ Report a post
exports.reportAdoption = (req, res) => {
    const id = Number(req.params.id);
    const { reason } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Invalid adoption ID" });
    }

    // Update report_count in adoptions table
    const updateSql = "UPDATE adoptions SET report_count = report_count + 1 WHERE id = ?";
    db.query(updateSql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Adoption post not found" });
        }
        //  Return success message
        res.json({ message: `Adoption post ${id} reported successfully`, reason: reason || null });
    });
};




// 9️⃣ Admin review/approve/reject adoption post ✅
exports.reviewAdoption = (req, res) => {
    const id = req.params.id;
    const { is_reviewed, rejection_reason } = req.body;

    const sql = `UPDATE adoptions SET is_reviewed = ?, rejection_reason = ?, updated_at = NOW() WHERE id = ?`;
    db.query(sql, [is_reviewed ? 1 : 0, rejection_reason || null, id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Adoption post not found" });
        res.json({ message: "Adoption post reviewed successfully" });
    });
};


exports.getModerationQueue = (req, res) => {
    const sql = `SELECT * FROM adoptions WHERE is_reviewed = 0 ORDER BY created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });

        if (!results.length) return res.status(404).json({ error: "No pending adoption posts found" });

        // Convert photos JSON to array & 0/1 to true/false
        results.forEach(row => {
            if (row.photos) {
                try {
                    row.photos = JSON.parse(row.photos);
                } catch {
                    row.photos = [];
                }
            }
            row.vaccinated = row.vaccinated === 1;
            row.dewormed = row.dewormed === 1;
            row.neutered = row.neutered === 1;
        });

        res.json({ totalCount: results.length, data: results });
    });
};



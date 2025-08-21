    const db = require('../db');

 // 1️⃣ Get all adoption posts with optional filters + pagination
exports.getAdoptions = (req, res) => {
    let { page = 1, limit = 10, species, city, status, userLat, userLng, radius } = req.query;
    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    let filterSql = "WHERE 1=1";
    const params = [];

    if (species) {
        filterSql += " AND species = ?";
        params.push(species);
    }
    if (city) {
        filterSql += " AND city = ?";
        params.push(city);
    }
    if (status) {
        filterSql += " AND status = ?";
        params.push(status);
    }

    // Add geo-location filter
    let distanceSelect = "";
    if (userLat && userLng && radius) {
        distanceSelect = `,
        (6371 * acos(
            cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?))
            + sin(radians(?)) * sin(radians(lat))
        )) AS distance`;
        filterSql += " HAVING distance <= ?";
        params.push(Number(userLat), Number(userLng), Number(userLat), Number(radius));
    }

    const sql = `
        SELECT *, lat, lng ${distanceSelect}
        FROM adoptions
        ${filterSql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `;

    db.query(sql, [...params, limit, offset], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error", details: err });
        res.json({ page, limit, data: results });
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
        status
    } = req.body;

    // ✅ Use logged-in user id
    const owner_user_id = req.user.id;

    if (!species) 
        return res.status(400).json({ error: "species is required" });

    age_value = age_value ? Number(age_value) : null;
    lat = lat ? Number(lat) : null;
    lng = lng ? Number(lng) : null;

    const sql = `
        INSERT INTO adoptions 
        (species, pet_name, gender, age_value, age_unit, vaccinated, dewormed, neutered, temperament, city, area, lat, lng, photos, video, owner_user_id, status, is_reviewed, report_count) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `;
    const params = [
        species.trim(), pet_name || null, gender || null,
        age_value, age_unit || null,
        vaccinated ? 1 : 0, dewormed ? 1 : 0, neutered ? 1 : 0,
        temperament || null, city || null, area || null,
        lat, lng,
        photos ? JSON.stringify(photos) : null, video || null,
        owner_user_id, status || "pending"
    ];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
        res.json({ message: "Adoption post created", id: result.insertId });
    });
};




// 4️⃣ Update adoption post
exports.updateAdoption = (req, res) => {
    const id = req.params.id;
    const updates = req.body; // could contain age_value, city, status, etc.

    // ✅ Ensure the logged-in user is the owner
    const checkSql = "SELECT owner_user_id FROM adoptions WHERE id = ?";
    db.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!results.length) return res.status(404).json({ error: "Adoption post not found" });

        if (results[0].owner_user_id !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to update this post" });
        }

        // ✅ Dynamically build update query
        const fields = [];
        const values = [];

        for (let key in updates) {
            if (updates[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        }

        if (!fields.length) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

        values.push(id); // last param is WHERE id = ?

        const query = `UPDATE adoptions SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`;

        db.query(query, values, (err2) => {
            if (err2) return res.status(500).json({ error: "Database error", details: err2 });
            res.json({ message: "Adoption post updated successfully" });
        });
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



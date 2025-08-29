const db = require('../../db');
const { normalizeAddress } = require('../../utils/utils');
const { getCoordinatesFromAddress } = require('../../utils/googleMaps');

// GET /admin/events
exports.getEvents = (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = "SELECT * FROM events WHERE 1=1";
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

// POST /admin/events
exports.createEvent = async (req, res) => {
    try {
        let { event_name, place, timings, contact_person, status = "active" } = req.body;

        // Normalize address
        place = normalizeAddress(place);

        // Geocode
        const coords = await getCoordinatesFromAddress(place);
        const lat = coords ? coords.lat : 0.0;
        const lng = coords ? coords.lng : 0.0;

        const sql = "INSERT INTO events (event_name, place, timings, contact_person, lat, lng, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(sql, [event_name, place, timings, contact_person, lat, lng, status], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: "Event created successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /admin/events/:id
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { event_name, place, timings, contact_person, status } = req.body;

        // Only normalize and geocode if place is provided
        let lat = 0.0, lng = 0.0;
        let normalizedPlace = place;
        if (place) {
            normalizedPlace = normalizeAddress(place);
            const coords = await getCoordinatesFromAddress(normalizedPlace);
            lat = coords ? coords.lat : 0.0;
            lng = coords ? coords.lng : 0.0;
        }

        const sql = `
            UPDATE events SET
            event_name = COALESCE(?, event_name),
            place = COALESCE(?, place),
            timings = COALESCE(?, timings),
            contact_person = COALESCE(?, contact_person),
            lat = COALESCE(?, lat),
            lng = COALESCE(?, lng),
            status = COALESCE(?, status)
            WHERE id = ?`;

        db.query(sql, [
            event_name, normalizedPlace, timings, contact_person, lat, lng, status, id
        ], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Event updated successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// DELETE /admin/events/:id
exports.deleteEvent = (req, res) => {
    const { id } = req.params;

    const sqlCheck = "SELECT * FROM events WHERE id=?";
    db.query(sqlCheck, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results.length) return res.status(404).json({ error: "Event not found" });

        const sql = "DELETE FROM events WHERE id=?";
        db.query(sql, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Event deleted successfully" });
        });
    });
};

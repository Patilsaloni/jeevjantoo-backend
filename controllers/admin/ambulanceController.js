const db = require("../../db");
const { normalizeAddress, getCoordinatesFromAddress } = require("../../utils/utils");

// GET /admin/ambulances
exports.getAmbulances = async (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = "SELECT * FROM ambulances WHERE 1=1";
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

// POST /admin/ambulances
exports.createAmbulance = async (req, res) => {
  try {
    let { name, contact, vehicle_number, governing_body, area, lat, lng, status = "active" } = req.body;

    // Normalize area as address
    const normalizedArea = normalizeAddress(area);

    // Geocode if lat/lng not provided
    if (!lat || !lng) {
      const coords = await getCoordinatesFromAddress(normalizedArea);
      lat = coords ? coords.lat : null;
      lng = coords ? coords.lng : null;
    }

    const sql = `INSERT INTO ambulances (name, contact, vehicle_number, governing_body, area, lat, lng, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [name, contact, vehicle_number, governing_body, normalizedArea, lat, lng, status], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, message: "Ambulance added successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /admin/ambulances/:id
exports.updateAmbulance = (req, res) => {
    const { id } = req.params;
    const { name, contact, vehicle_number, governing_body, area, status } = req.body;

    const sql = `
        UPDATE ambulances
        SET name=?, contact=?, vehicle_number=?, governing_body=?, area=?, status=?
        WHERE id=?
    `;
    db.query(sql, [name, contact, vehicle_number, governing_body, area, status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `No ambulance found with id ${id}` });
        }

        res.json({ message: "Ambulance updated successfully" });
    });
};



// DELETE /admin/ambulances/:id
exports.deleteAmbulance = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM ambulances WHERE id=?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `No ambulance found with id ${id}` });
        }

        res.json({ message: "Ambulance deleted successfully" });
    });
};


// server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import routes
const clinicsRoutes = require('./routes/clinics');
const ngosRoutes = require('./routes/ngos');
const eventsRoutes = require('./routes/events');  
const ambulancesRoutes = require('./routes/ambulance');
const boardingSpaRoutes = require('./routes/boardingSpa');
const feedingRoutes = require('./routes/feeding');
const govtHelplineRoutes = require('./routes/govtHelpline');
const medicalInsuranceRoutes = require('./routes/medicalInsurance');
const abcRoutes = require('./routes/abc');
const adoptionRoutes = require('./routes/adoptions');
const usersRoutes = require('./routes/users');
const adminRoutes = require("./routes/adminRoutes");
const adminAdoptionsRoutes = require("./routes/admin/adoptions");
const adminClinicsRoutes = require("./routes/admin/clinics");
const adminNgosRoutes = require("./routes/admin/ngos")
const adminAmbulanceRoutes = require("./routes/admin/ambulance");
const adminEventsRoutes = require("./routes/admin/events");
const adminBoardingSpaRoutes = require("./routes/admin/boardingSpa");
const adminAbcRoutes = require('./routes/admin/abc');
const adminGovtHelplineRoutes = require("./routes/admin/govtHelpline");
const adminFeedingRoutes = require("./routes/admin/feeding");
const adminMedicalInsuranceRoutes = require('./routes/admin/medicalInsurance');
const directoryReportRoutes = require("./routes/directoryReportRoutes");
const adminDirectoryRoutes = require("./routes/admin/directoryRoutes");


const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 
app.use(bodyParser.json());

// Mount routers
app.use('/api/v1/clinics', clinicsRoutes);
app.use('/api/v1/ngos', ngosRoutes);
app.use('/api/v1/events', eventsRoutes); 
app.use('/api/v1/ambulance', ambulancesRoutes);
app.use('/api/v1/boarding-spa', boardingSpaRoutes);
app.use('/api/v1/feeding', feedingRoutes);
app.use('/api/v1/govthelpline', govtHelplineRoutes);
app.use('/api/v1/medicalinsurance', medicalInsuranceRoutes);
app.use('/api/v1/abc', abcRoutes);
app.use('/api/v1/adoptions', adoptionRoutes);
app.use('/api/v1/users', usersRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/adoptions", adminAdoptionsRoutes);
app.use("/api/v1/admin/clinics", adminClinicsRoutes);
app.use("/api/v1/admin/ngos", adminNgosRoutes)
app.use("/api/v1/admin/ambulances", adminAmbulanceRoutes);
app.use("/api/v1/admin/events", adminEventsRoutes);
app.use("/api/v1/admin/boarding-spa", adminBoardingSpaRoutes);
app.use("/api/v1/admin/abc", adminAbcRoutes);
app.use("/api/v1/admin/govthelpline", adminGovtHelplineRoutes);
app.use("/api/v1/admin/feeding", adminFeedingRoutes);
app.use("/api/v1/admin/medical-insurance", adminMedicalInsuranceRoutes);
app.use("/api/v1/directories", directoryReportRoutes);
app.use("/api/v1/admin/directories", adminDirectoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

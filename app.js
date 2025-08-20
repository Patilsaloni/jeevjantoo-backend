const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const clinicsRoutes = require('./routes/clinics'); // ✅ should return a router
const ngosRoutes = require('./routes/ngos');
const eventsRoutes = require('./routes/events');  
const ambulancesRoutes = require('./routes/ambulance');
const boardingSpaRoutes = require('./routes/boardingSpa');
const feedingRoutes = require('./routes/feeding');
const govtHelplineRoutes = require('./routes/govtHelpline');
const medicalInsuranceRoutes = require('./routes/medicalInsurance');
const abcRoutes = require('./routes/abc');
const adoptionRoutes = require('./routes/adoptions');
// const usersRoutes = require('./routes/users');
// const adminRoutes = require('./routes/adminRoutes');

const app = express();
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
// app.use('/api/v1/users', usersRoutes);
// app.use('/api/v1/admin', adminRoutes); 
// app.use('/api/v1/admin', adminRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

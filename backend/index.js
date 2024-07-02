const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const userRoutes = require("./routes/user-route");
require('dotenv').config();
const app = express();
const port = 3000;
// Configure CORS
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: "GET,HEAD,PUT,PACTCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/user", userRoutes);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

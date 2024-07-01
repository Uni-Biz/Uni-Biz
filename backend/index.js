const express = require('express')
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require("./routes/userRoutes");
require('dotenv').config()
const app = express()

app.use(bodyParser.json())
app.use(cors());
app.use(express.json());

app.use("/user", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

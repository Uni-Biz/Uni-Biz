const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/user-route"); // Corrected path

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use("/user", userRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

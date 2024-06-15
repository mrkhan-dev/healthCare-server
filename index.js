const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 8000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("doctor is working");
});

app.listen(port, () => {
  console.log(`Doctor is running on port ${port}`);
});

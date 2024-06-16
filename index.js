const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const {MongoClient, ServerApiVersion} = require("mongodb");
const port = process.env.PORT || 8000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aeb0oh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const upcomingTestCollection = client
      .db("healthCareDB")
      .collection("upcomingTests");
    const userCollection = client.db("healthCareDB").collection("users");

    // get upcoming test to homepage
    app.get("/upcomingTest", async (req, res) => {
      const result = await upcomingTestCollection.find().toArray();
      res.send(result);
    });

    // post user info to database
    app.post("/userInfo", async (req, res) => {
      const users = req.body;
      const query = {email: users.email};
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({message: "this user already exist"});
      }
      const result = await userCollection.insertOne(users);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ping: 1});
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("doctor is working");
});

app.listen(port, () => {
  console.log(`Doctor is running on port ${port}`);
});

const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
require("dotenv").config();
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const port = process.env.PORT || 8000;

// middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

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
    const allTestCollection = client.db("healthCareDB").collection("allTests");

    // jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({token});
    });

    // jwt middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({message: "forbidden access"});
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({message: "forbidden access"});
        }
        req.decoded = decoded;
        next();
      });
    };

    // check admin
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({message: "unauthorized access"});
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({admin});
    });

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
        return res.send({message: "this user already exist", insertedId: null});
      }
      const result = await userCollection.insertOne(users);
      res.send(result);
    });

    // post add test data
    app.post("/addTest", async (req, res) => {
      const newTest = req.body;
      const result = await allTestCollection.insertOne(newTest);
      res.send(result);
    });

    // get all test data
    app.get("/allTests", async (req, res) => {
      const result = await allTestCollection.find().toArray();
      res.send(result);
    });

    // get single test data by id
    app.get("/testDetails/:id", async (req, res) => {
      const result = await allTestCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // set admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // handle user status
    app.patch("/users/status/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          status: "block",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // get all users
    app.get("/users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/userInfo/:email", async (req, res) => {
      const result = await userCollection
        .find({email: req.params.email})
        .toArray();
      res.send(result);
    });

    // update test details
    app.put("/updateTest/:id", async (req, res) => {
      const query = {_id: new ObjectId(req.params.id)};
      const test = req.body;
      const testInfo = {
        $set: {
          testName: test.testName,
          image: test.image,
          slots: test.slots,
          price: test.price,
          date: test.date,
          description: test.description,
        },
      };
      const result = await allTestCollection.updateOne(query, testInfo);
      res.send(result);
    });

    // delete test
    app.delete("/test/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await allTestCollection.deleteOne(query);
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

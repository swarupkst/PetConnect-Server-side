const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("petconnect");
    const destinationCollection = db.collection("destination");

    const adoptionsCollection = db.collection("adoptions");

    // GET ALL

    app.get("/destination", async (req, res) => {
      try {
        const result = await destinationCollection
          .find()
          .sort({ createdAt: -1 }) // 🔥 NEW FIRST
          .toArray();

        res.json(result);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET BY ID

    app.get("/destination/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid ID" });
        }

        const pet = await destinationCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!pet) {
          return res.status(404).json({ message: "Pet not found" });
        }

        res.json(pet);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //////////
// CREATE

    app.post("/destination", async (req, res) => {
      try {
        const pet = {
          ...req.body,
          createdAt: new Date(), 
        };

        const result = await destinationCollection.insertOne(pet);

        res.status(201).json({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    // UPDATE

    app.put("/destination/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid ID" });
        }

        const result = await destinationCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Pet not found" });
        }

        res.json({
          success: true,
          message: "Updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });
    
    // DELETE

    app.delete("/destination/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid ID" });
        }

        const result = await destinationCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Pet not found" });
        }

        res.json({
          success: true,
          message: "Deleted successfully",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    
    // MongoDB ping
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB Ping Successful");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}

run();

// Root route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
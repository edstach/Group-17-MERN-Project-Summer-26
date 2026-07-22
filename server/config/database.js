require("dotenv").config();

const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

let db;

async function connectDB() {
    try {
        await client.connect();

        db = client.db("SplitSnapDB");

        console.log("Connected to Database!");

    } catch (err) {
        console.error("Database connection failed");
        console.error(err);
    }
}

function getDB() {
    return db;
}

module.exports = {
    connectDB,
    getDB
};
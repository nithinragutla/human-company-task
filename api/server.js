const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const serverless = require("serverless-http");

const { ApolloServer } = require("apollo-server-express");

dotenv.config();

const authRoutes = require("../routes/auth.routes");
const bookRoutes = require("../routes/book.routes");
const borrowRoutes = require("../routes/borrow.routes");
const typeDefs = require("../graphql/schema");
const resolvers = require("../graphql/resolvers");

const app = express();
app.use(cors());
app.use(express.json());

// REST routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);

// ApolloServer
const graphqlServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.split(" ")[1];
      if (token) {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
      }
    } catch (err) {
      req.user = null;
    }
    return { req };
  },
});

// We need to wait until MongoDB and Apollo are initialized before exporting
let isInitialized = false;

const handler = async (req, res) => {
  if (!isInitialized) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");

      await graphqlServer.start();
      graphqlServer.applyMiddleware({ app, path: "/api/graphql" });

      isInitialized = true;
    } catch (error) {
      console.error("Startup Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  const expressHandler = serverless(app);
  return expressHandler(req, res);
};

module.exports = handler;

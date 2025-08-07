// api/server.js

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const serverless = require("serverless-http");

dotenv.config();

// Routes
const authRoutes = require("../routes/auth.routes");
const bookRoutes = require("../routes/book.routes");
const borrowRoutes = require("../routes/borrow.routes");

// GraphQL
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("../graphql/schema");
const resolvers = require("../graphql/resolvers");

const app = express();
app.use(cors());
app.use(express.json());

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);

// MongoDB Connection (only run once per cold start)
let isDbConnected = false;
async function connectDB() {
  if (!isDbConnected) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
    isDbConnected = true;
  }
}

// Apollo Server (GraphQL)
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

let apolloStarted = false;

async function startServer() {
  await connectDB();

  if (!apolloStarted) {
    await graphqlServer.start();
    graphqlServer.applyMiddleware({ app, path: "/api/graphql" });
    apolloStarted = true;
  }
}

startServer();

// ❗️No app.listen() here – Vercel handles that part!

module.exports = serverless(app);

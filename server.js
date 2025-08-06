const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");

dotenv.config();

const authRoutes = require("../routes/auth.routes");
const bookRoutes = require("../routes/book.routes");
const borrowRoutes = require("../routes/borrow.routes");

const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("../graphql/schema");
const resolvers = require("../graphql/resolvers");

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection failed", err));

const app = express();
app.use(cors());
app.use(express.json());

// REST routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);

// Apollo GraphQL setup
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
  }
});

async function startServer() {
  await graphqlServer.start();
  graphqlServer.applyMiddleware({ app, path: "/api/graphql" });
}
startServer();

// Export as Vercel function
module.exports = app;
module.exports.handler = serverless(app);

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");

dotenv.config();

const authRoutes = require("./routes/auth.routes");
const bookRoutes = require("./routes/book.routes");
const borrowRoutes = require("./routes/borrow.routes");

const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

const app = express();
app.use(cors());
app.use(express.json());

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);

// GraphQL
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

const startApp = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    await graphqlServer.start();
    graphqlServer.applyMiddleware({ app, path: "/api/graphql" });

    const PORT = process.env.PORT || 5000;

    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error("Failed to connect MongoDB", err);
  }
};

startApp();

// ✅ Only export app (not handler)
module.exports = app;

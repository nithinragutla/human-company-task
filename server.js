const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Load environment variables from .env
dotenv.config();

// MongoDB connection
const connectDB = require("./config/db");
connectDB();

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// REST Routes
const authRoutes = require("./routes/auth.routes");
const bookRoutes = require("./routes/book.routes");
const borrowRoutes = require("./routes/borrow.routes");

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);

// Apollo GraphQL Server Setup
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Add user to context if token is present
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

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(
      `🚀 Server running at http://localhost:${PORT}${server.graphqlPath}`
    )
  );
}

// Start everything
startApolloServer();

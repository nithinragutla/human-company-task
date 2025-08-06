const express = require("express");
const router = express.Router();
const {
  addBook,
  updateBook,
  deleteBook,
  listBooks
} = require("../controllers/book.controllers");

const { verifyToken, isAdmin } = require("../middleware/auth");

// Public route for all users
router.get("/", listBooks);

// Admin-only routes
router.post("/add", verifyToken, isAdmin, addBook);
router.put("/update/:id", verifyToken, isAdmin, updateBook);
router.delete("/delete/:id", verifyToken, isAdmin, deleteBook);

module.exports = router;

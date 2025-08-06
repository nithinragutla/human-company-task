const express = require("express");
const router = express.Router();
const {
  borrowBook,
  returnBook,
  borrowHistory,
  mostBorrowedBooks,
  activeMembers,
  bookAvailability
} = require("../controllers/borrow.controllers");

const { verifyToken, isMember, isAdmin } = require("../middleware/auth");

// Member routes
router.post("/", verifyToken, isMember, borrowBook);
router.put("/return/:id", verifyToken, isMember, returnBook);
router.get("/history", verifyToken, isMember, borrowHistory);

// Admin-only reports
router.get("/report/most-borrowed", verifyToken, isAdmin, mostBorrowedBooks);
router.get("/report/active-members", verifyToken, isAdmin, activeMembers);
router.get("/report/book-availability", verifyToken, isAdmin, bookAvailability);

module.exports = router;

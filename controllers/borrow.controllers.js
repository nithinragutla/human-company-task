const Borrow = require("../models/Borrow");
const Book = require("../models/Book");

exports.borrowBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book || book.copies < 1)
      return res.status(400).json({ message: "Book not available" });

    book.copies -= 1;
    await book.save();

    const borrow = new Borrow({
      user: req.user.id,
      book: bookId,
      borrowDate: new Date(),
      isReturned: false
    });

    await borrow.save();
    res.status(201).json({ message: "Book borrowed", borrow });
  } catch (err) {
    res.status(500).json({ message: "Borrow failed", error: err.message });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const borrow = await Borrow.findById(id);
    if (!borrow || borrow.isReturned)
      return res.status(400).json({ message: "Invalid borrow record" });

    borrow.isReturned = true;
    borrow.returnDate = new Date();
    await borrow.save();

    const book = await Book.findById(borrow.book);
    book.copies += 1;
    await book.save();

    res.json({ message: "Book returned" });
  } catch (err) {
    res.status(500).json({ message: "Return failed", error: err.message });
  }
};

exports.borrowHistory = async (req, res) => {
  try {
    const history = await Borrow.find({ user: req.user.id })
      .populate("book", "title author");

    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history", error: err.message });
  }
};

exports.mostBorrowedBooks = async (req, res) => {
  try {
    const result = await Borrow.aggregate([
      { $group: { _id: "$book", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "bookDetails" } },
      { $unwind: "$bookDetails" }
    ]);

    res.json({ mostBorrowed: result });
  } catch (err) {
    res.status(500).json({ message: "Aggregation failed", error: err.message });
  }
};

exports.activeMembers = async (req, res) => {
  try {
    const result = await Borrow.aggregate([
      { $match: { isReturned: true } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userDetails" } },
      { $unwind: "$userDetails" }
    ]);

    res.json({ activeMembers: result });
  } catch (err) {
    res.status(500).json({ message: "Aggregation failed", error: err.message });
  }
};

exports.bookAvailability = async (req, res) => {
  try {
    const books = await Book.find();
    let total = 0, available = 0;

    books.forEach(book => {
      total += book.copies;
      available += book.copies;
    });

    const borrowed = total - available;
    res.json({ totalBooks: total, availableBooks: available, borrowedBooks: borrowed });
  } catch (err) {
    res.status(500).json({ message: "Report failed", error: err.message });
  }
};

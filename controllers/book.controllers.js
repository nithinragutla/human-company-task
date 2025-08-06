const Book = require("../models/Book");

exports.addBook = async (req, res) => {
  try {
    const { title, author, isbn, publicationDate, genre, copies } = req.body;

    const book = new Book({ title, author, isbn, publicationDate, genre, copies });
    await book.save();

    res.status(201).json({ message: "Book added", book });
  } catch (err) {
    res.status(500).json({ message: "Failed to add book", error: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Book.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated)
      return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book updated", book: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Book.findByIdAndDelete(id);

    if (!deleted)
      return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

exports.listBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, genre, author } = req.query;
    const filter = {};
    if (genre) filter.genre = genre;
    if (author) filter.author = author;

    const books = await Book.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const count = await Book.countDocuments(filter);

    res.json({ total: count, books });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};

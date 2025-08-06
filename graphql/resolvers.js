const User = require("../models/User");
const Book = require("../models/Book");
const Borrow = require("../models/Borrow");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const resolvers = {
  Query: {
    me: async (_, __, { req }) => {
      const user = await User.findById(req.user?.id);
      return user;
    },
    getBooks: async () => await Book.find(),
    borrowHistory: async (_, __, { req }) =>
      await Borrow.find({ user: req.user.id }).populate("book user"),
    mostBorrowedBooks: async () => {
      return await Borrow.aggregate([
        { $group: { _id: "$book", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "books",
            localField: "_id",
            foreignField: "_id",
            as: "bookDetails"
          }
        },
        { $unwind: "$bookDetails" },
        {
          $project: {
            bookDetails: 1,
            count: 1
          }
        }
      ]);
    },
    activeMembers: async () => {
      return await Borrow.aggregate([
        { $match: { isReturned: true } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            userDetails: 1,
            count: 1
          }
        }
      ]);
    },
    bookAvailability: async () => {
      const books = await Book.find();
      let total = 0;
      let available = 0;

      books.forEach((book) => {
        total += book.copies;
        available += book.copies;
      });

      return {
        totalBooks: total,
        availableBooks: available,
        borrowedBooks: total - available
      };
    }
  },

  Mutation: {
    register: async (_, { name, email, password, role }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new Error("Email already in use");

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword, role });
      await user.save();
      return "Registered successfully";
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("Invalid email");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Incorrect password");

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d"
      });

      return {
        token,
        user
      };
    },

    addBook: async (_, args, { req }) => {
      if (req.user?.role !== "Admin") throw new Error("Admin access required");
      const book = new Book(args);
      await book.save();
      return book;
    },

    updateBook: async (_, { id, ...updates }, { req }) => {
      if (req.user?.role !== "Admin") throw new Error("Admin access required");
      const book = await Book.findByIdAndUpdate(id, updates, { new: true });
      if (!book) throw new Error("Book not found");
      return book;
    },

    deleteBook: async (_, { id }, { req }) => {
      if (req.user?.role !== "Admin") throw new Error("Admin access required");
      const book = await Book.findByIdAndDelete(id);
      if (!book) throw new Error("Book not found");
      return "Book deleted";
    },

    borrowBook: async (_, { bookId }, { req }) => {
      if (req.user?.role !== "Member") throw new Error("Only members can borrow");

      const book = await Book.findById(bookId);
      if (!book || book.copies < 1) throw new Error("Book unavailable");

      book.copies -= 1;
      await book.save();

      const borrow = new Borrow({
        user: req.user.id,
        book: bookId,
        isReturned: false
      });

      await borrow.save();
      return borrow.populate("book user");
    },

    returnBook: async (_, { id }, { req }) => {
      if (req.user?.role !== "Member") throw new Error("Only members can return");

      const borrow = await Borrow.findById(id);
      if (!borrow || borrow.isReturned) throw new Error("Invalid borrow");

      borrow.isReturned = true;
      borrow.returnDate = new Date();
      await borrow.save();

      const book = await Book.findById(borrow.book);
      book.copies += 1;
      await book.save();

      return "Returned successfully";
    }
  }
};

module.exports = resolvers;

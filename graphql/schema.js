const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type Book {
    id: ID!
    title: String!
    author: String!
    isbn: String!
    publicationDate: String!
    genre: String!
    copies: Int!
  }

  type Borrow {
    id: ID!
    user: User!
    book: Book!
    borrowDate: String!
    returnDate: String
    isReturned: Boolean!
  }

  type MostBorrowed {
    bookDetails: Book!
    count: Int!
  }

  type ActiveMember {
    userDetails: User!
    count: Int!
  }

  type BookAvailability {
    totalBooks: Int!
    availableBooks: Int!
    borrowedBooks: Int!
  }

  type Query {
    me: User
    getBooks: [Book]
    borrowHistory: [Borrow]
    mostBorrowedBooks: [MostBorrowed]
    activeMembers: [ActiveMember]
    bookAvailability: BookAvailability
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, role: String): String!
    login(email: String!, password: String!): AuthPayload!

    addBook(
      title: String!
      author: String!
      isbn: String!
      publicationDate: String!
      genre: String!
      copies: Int!
    ): Book!

    updateBook(
      id: ID!
      title: String
      author: String
      isbn: String
      publicationDate: String
      genre: String
      copies: Int
    ): Book!

    deleteBook(id: ID!): String!

    borrowBook(bookId: ID!): Borrow!
    returnBook(id: ID!): String!
  }
`;

module.exports = typeDefs;

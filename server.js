var express = require("express");
var { createHandler } = require("graphql-http/lib/use/express");
var { buildSchema } = require("graphql");
var { ruruHTML } = require("ruru/server");
var mockData = require("./MOCK_DATA.json");

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  input MessageInput {
    content: String,
    author: String
  }

  type Message {
    id: ID!,
    content: String,
    author: String
  }

  type User {
    id: Int,
    first_name: String,
    last_name: String,
    email: String,
    gender: String,
    ip_address: String,
  }

  type Query {
    hello: String
    random: Float!
    sum(a: Int!,b: Int): Int
    getMessage(id: ID!): Message
    getUser(id: Int): User
  }

  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }
`);

class Message {
  constructor(id, { content, author }) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

class User {
  constructor(id, { first_name, last_name, gender, ip_address, email }) {
    this.id = id;
    this.first_name = first_name;
    this.last_name = last_name;
    this.email = email;
    this.ip_address = ip_address;
    this.gender = gender;
  }
}

var fakeDatabase = {};
// The root provides a resolver function for each API endpoint
var rootValue = {
  getUser({ id }) {
    let user = mockData.filter((it) => {
      return it.id == id;
    })[0];

    let body = {
      first_name: user.first_name,
      last_name: user.last_name,
      gender: user.gender,
      ip_address: user.ip_address,
      email: user.email,
    };
    return new User(user.id, body);
  },
  getMessage({ id }) {
    if (!fakeDatabase[id]) {
      throw new Error("no message exists with id " + id);
    }
    console.log(mockData);
    return new Message(id, fakeDatabase[id]);
  },
  createMessage({ input }) {
    var id = require("crypto").randomBytes(10).toString("hex");

    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  updateMessage({ id, input }) {
    if (!fakeDatabase) {
      throw new Error("no message exists with id " + id);
    }
    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  hello() {
    return "Hello world!";
  },
  random() {
    return Math.random();
  },
  sum({ a, b }) {
    return a + b;
  },
};

var app = express();
const options = {
  schema,
  rootValue,
};

// Create and use the GraphQL handler.
app.get("/", (_req, res) => {
  res.type("html");
  res.end(ruruHTML({ endpoint: "/graphql" }));
});
app.all("/graphql", createHandler(options));

// Start the server at port
app.listen(3000);
console.log("Running a GraphQL API server at http://localhost:4000/graphql");

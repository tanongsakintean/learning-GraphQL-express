var express = require("express");
var { createHandler } = require("graphql-http/lib/use/express");
var { buildSchema } = require("graphql");
var { ruruHTML } = require("ruru/server");
// var mockData = require("./MOCK_DATA.json");

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  input MessageInput {
    content: String,
    author: String
  }

  input UserInput {
    firstName: String,
    lastName: String,
    email: String,
    gender: String,
    address: String,
    height: Int
  }

  input FamilyInput{
    name: String
    count: Int
    persons: [UserInput!]!
  }

  type Message {
    id: ID!,
    content: String,
    author: String
  }

  type User {
    id: String,
    firstName: String,
    lastName: String,
    email: String,
    gender: String,
    address: String,
    height(unit: HeightUnit = FOOT): Float
  }

enum HeightUnit {
  METER
  FOOT
}

  type Query {
    hello: String
    random: Float!
    sum(a: Int!,b: Int): Int
    getMessage(id: ID!): Message
    getUser(id: String): User
    getAllUser: [User!]!
    family(id:String): [Family!]!
  }

  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
    createFamily(body: FamilyInput): Family
  }

  type Family {
    id: String
    name: String
    count: Int
    persons: [User]
  }
`);

class Message {
  constructor(id, { content, author }) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

class Family {
  constructor(id, { name, count, users }) {
    this.id = id;
    this.name = name;
    this.count = count;
    this.persons = users;
  }
}

class User {
  constructor(id, { firstName, lastName, gender, address, email, height }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.address = address;
    this.gender = gender;
    this.height = height;
  }
}

var fakeDatabase = [];
// The root provides a resolver function for each API endpoint
var rootValue = {
  createFamily({ body }) {
    let { persons, name, count } = body;
    var id = require("crypto").randomBytes(10).toString("hex");

    users = persons.map((item) => {
      return new User(require("crypto").randomBytes(10).toString("hex"), {
        firstName: item.firstName,
        lastName: item.lastName,
        address: item.address,
        email: item.email,
        gender: item.gender,
        height: item.height,
      });
    });

    fakeDatabase.push(
      new Family(id, {
        name,
        count,
        users,
      })
    );

    return fakeDatabase[fakeDatabase.length - 1];
  },
  family({ id }) {
    let family = fakeDatabase.filter((it) => {
      return it.id == id;
    });

    if (id == null) {
      return fakeDatabase;
    } else {
      return family;
    }
  },
  async getUser({ id }) {
    let mockData = await fetch(
      "https://668245c204acc3545a08dbf7.mockapi.io/api/v1/users"
    ).then((res) => res.json());

    let user = mockData.filter((it) => {
      return it.id == id;
    })[0];

    let body = {
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      address: user.address,
      email: user.email,
      height: user.height,
    };
    return new User(user.id, body);
  },
  async getAllUser() {
    let mockData = await fetch(
      "https://668245c204acc3545a08dbf7.mockapi.io/api/v1/users"
    ).then((res) => res.json());

    users = await mockData.map((it) => {
      return new User(it.id, {
        lastName: it.lastName,
        firstName: it.firstName,
        gender: it.gender,
        email: it.email,
        address: it.address,
        height: it.height,
      });
    });
    return users;
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
console.log("Running a GraphQL API server at http://localhost:3000/graphql");

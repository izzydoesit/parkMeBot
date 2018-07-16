import bodyParser from 'body-parser';
import { log } from './utils';
import routes from './routes';
import { buildSchema } from 'graphql';
import ExpressGraphQL from 'express-graphql';
import UUID from 'uuid';
import Couchbase from 'couchbase';
const NQL = Couchbase.N1qlQuery;

const schema = buildSchema(`
  type Query {
    order(id: String!): [Order],
    orders: [Order],
    bids(direction: String!): [Order],
    offers: [Order],
    matchOrder: [Order]
  }

  type Order {
    id: String,
    userId: String!,
    direction: String!,
    date: String!
  }

  type Mutation {
    createOrder(id: String, userId: String, direction: String!, date: String!): Order
  }
`);

let resolvers = {

  order: (data) => {
    const id = data.id;
    return new Promise((resolve, reject) => {
      orderPool.get(id, (error, result) => {
        if (error) return reject(error);
        resolve(result.value);
      });
    })
  },

  orders: () => {
    const query = 'SELECT META(order).id, order.* FROM orders as order';
    const nqlQuery = NQL.fromString(query);
    return new Promise((resolve, reject) => {
      orders.query(nqlQuery, (error, result) => {
        if (error) reject(error);
        resolve(result)
      })
    })
  },

  bids: (data) => {
    const query = "SELECT META(order).id, order.*  FROM orders as order WHERE order.direction = 'B'";
    const nqlQuery = NQL.fromString(query);
    return new Promise((resolve, reject) => {
      orders.query(nqlQuery, (error, result) => {
        if (error) reject(error);
        resolve(result)
      })
    })
  },

  offers: (data) => {
    const query = "SELECT META(order).id, order.*  FROM orders as order WHERE order.direction = 'S'";
    const nqlQuery = NQL.fromString(query);
    return new Promise((resolve, reject) => {
      orders.query(nqlQuery, (error, result) => {
        if (error) reject(error);
        resolve(result)
      })
    })
  },

  matchOrder: (data) => {
    const query = `SELECT META(order).id, order.* FROM orders AS order where order.date = $date AND order.direction = $direction`;
    const nqlString = NQL.fromString(query);
    return new Promise((resolve, reject) => {
      orderPool.query(nqlString, { date: data.date, direction: data.direction }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  },

  createOrder: (data) => {
    const id = UUID.v4();
    return new Promise((resolve, reject) => {
      orderPool.insert(id, data, (error, result) => {
        if (error) return reject(error);
        resolve({ "id": id });
      })
    })
  }
};

export default function (app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Routes
  app.use(routes);

  // DB
  app.use('/graphql', ExpressGraphQL({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
  }));

  // 404
  app.use((req, res) => {
    res.status(404).send({
      status: 404,
      message: 'The requested resource was not found',
    });
  });

  // 5xx
  app.use((err, req, res) => {
    log.error(err.stack);
    const message = process.env.NODE_ENV === 'production'
      ? 'Something went wrong, we\'re looking into it...'
      : err.stack;
    res.status(500).send({
      status: 500,
      message,
    });
  });
}

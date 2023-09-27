import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './GraphQL/typeDef';
import resolvers from './GraphQL/resolver';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startApolloServer();

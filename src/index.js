import '@babel/polyfill';
import http from 'http';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import schema from './graphql';
import models from './models';
import {
  graphqlUploadExpress
} from 'graphql-upload';
const PORT = 4000

const context = ({ req, connection }) => {
  if (connection) {
    // check connection for metadata
    return connection.context;
  }

  const token = req.headers.authorization || ''

  return {
    token,
    models
  }
}

const subscriptions = {
  onConnect: (connectionParams) => {
    
    if (connectionParams.authorization) {  
      return {
        token: connectionParams.authorization,
        models
      }
    }

    throw new Error('Missing auth token!');
  }
}

const server = new ApolloServer({ schema, context, subscriptions, uploads: false });
const app = express();
app.use(graphqlUploadExpress());
server.applyMiddleware({ app });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

// The `listen` method launches a web server.
httpServer.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)
})

import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { object, string } from 'yup';
import { inputValidation, isUserExistAndValidPassword, privateResolver } from '../../graphql/resolver-middleware';
import jwt from 'jsonwebtoken';

const schemaValidation = object().shape({
  password: string().required(),
  email: string().email().required()
})

const SECRET = 'mysecret'

const generateToken = (id, email) =>
  jwt.sign(
    {
      id,
      email
    },
    SECRET,
    { expiresIn: '1d' }
  );

const resolvers = {
  Mutation: {
    login: async (_, args) => {
      
      return generateToken(args.id, args.email)
    }
  },
  Query: {
    users: async (_, __, { models }) => {
      
      const { User } = models
      const response = await new User().fetchAll({withRelated: ['rooms', 'consumer']});
      return response && response.serialize();
    },
    showUser : async (_, __, { models, auth }) => {
      
      const { User } = models
      const response = await new User({ id: auth.id }).fetch({withRelated: ['rooms', 'consumer']});
      return response && response.serialize();
    }
  }
}

const resolversComposition = {
  'Mutation.login': [inputValidation(schemaValidation), isUserExistAndValidPassword()],
  'Query.users': [privateResolver()],
  'Query.showUser': [privateResolver()],
};

export default composeResolvers(resolvers, resolversComposition);

import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { object, string, ref } from 'yup';
import { inputValidation, isUserExistAndValidPassword, privateResolver, UserInputError } from '../../graphql/resolver-middleware';
import jwt from 'jsonwebtoken';
import bookshelf  from '../../config';
import bcrypt from 'bcryptjs';

const schemaValidation = object().shape({
  password: string().required(),
  email: string().email().required()
})

const schemaValidationRegister = object().shape({
  confirm_password: string().oneOf([ref('password'), null], 'Passwords must match').required(),
  password: string().min(8).required(),
  name: string().required(),
  email: string().email().required()
})

const schemaValidationForGenerateClientToken = object().shape({
  name: string().required(),
  email: string().required()
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
    },
    register: async (_, { email, name, password }, { models }) => {
      const { User, Consumer } = models
      return bookshelf.transaction(async transacting => {
        const isEmailExist = await new User({ email }).fetch({ require: false })
      
        if(isEmailExist)
          throw new UserInputError('Email Already Exist')

        const consumer = await new Consumer().save({ name }, { transacting, require: false })

        const user = await new User().save(
          { email, name, is_main: 1, password: bcrypt.hashSync(password), consumer_id: consumer.id }, 
          { transacting, require: false }
        )
        .then(user => user && user.serialize())
          
        return generateToken(user.id, email)
      })
      
    },
    widgetLogin: async (_, { access_key, token }, { models }) => {
      const { Consumer, User } = models
      const consumerViaAccessKey = await new Consumer({ access_key })
          .fetch({ require: false })
          .then(res => res && res.serialize())
      
      if(!consumerViaAccessKey)
        throw  new UserInputError('Invalid Access Key')

      const user = new User({ password: token }).fetch({ require: false, withRelated: ['consumer', 'rooms'] })
        .then(res => res && res.serialize())

      if(!user)
        throw  new UserInputError('Invalid Access Key')

      return user
    },
    generateClientToken: async (_, { email, access_key, name }, { models }) => {

      return bookshelf.transaction(async transacting => {
        const { User, Consumer } = models

        const consumerViaAccessKey = await new Consumer({ access_key })
          .fetch({ require: false })
          .then(res => res && res.serialize())
      
        if(!consumerViaAccessKey)
          throw  new UserInputError('Invalid Access Key')

        const isExistUserViaEmail = await new User({ email }).fetch({ require: false, withRelated: ['consumer'] })
          .then(res => res && res.serialize())
        
        if(!isExistUserViaEmail){
          const newUser = await new User().save({ email, name, consumer_id: consumerViaAccessKey.id, is_main: 0 }, 
            { require: false, autoRefresh: true, transacting })
            .then(async res => {
              const serializedNewUser = res && res.serialize()
              const token = generateToken(serializedNewUser.id, serializedNewUser.email)
              await new User().where({ id: serializedNewUser.id }).save({ password: token }, 
                  { method: 'UPDATE', require: false, withRelated: ['consumer'], autoRefresh: true, transacting })
              return token
            })

          return newUser
        }

        const token = generateToken(isExistUserViaEmail.id, isExistUserViaEmail.email)
        await new User().where({ id: isExistUserViaEmail.id }).save({ password: token }, 
          { method: 'UPDATE', require: false, withRelated: ['consumer'], autoRefresh: true, transacting })
        return token
      })

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
      const response = await new User({ id: auth.id }).fetch({withRelated: ['rooms', 'consumer'], require: false});
      
      return response && response.serialize();
    }
  }
}

const resolversComposition = {
  'Mutation.login': [inputValidation(schemaValidation), isUserExistAndValidPassword()],
  'Mutation.register': [inputValidation(schemaValidationRegister)],
  'Mutation.generateClientToken': [inputValidation(schemaValidationForGenerateClientToken)],
  'Query.users': [privateResolver()],
  'Query.showUser': [privateResolver()],
};

export default composeResolvers(resolvers, resolversComposition);

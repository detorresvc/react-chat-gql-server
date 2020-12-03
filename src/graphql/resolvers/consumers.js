import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { object, string } from 'yup';
import { UserInputError, inputValidation } from '../../graphql/resolver-middleware';


const schemaValidation = object().shape({
  access_key: string().required()
})

const resolvers = {
  Query: {
    getConsumer: async (_, { access_key }, { models, client_referer }) => {
      const { Consumer } = models
      const consumer = await new Consumer({ access_key }).fetch({ require: false })
        .then(res => res && res.serialize())

      if(!consumer){
        throw new UserInputError('Invalid Access Key')
      }

      const exp = new RegExp(consumer.website_domain)
      if(!exp.test(client_referer)){
        throw new UserInputError('Invalid Access Key')
      }
      
      return consumer
    }
  }
}

const resolversComposition = {
  'Query.getConsumer': [inputValidation(schemaValidation)]
};

export default composeResolvers(resolvers, resolversComposition);

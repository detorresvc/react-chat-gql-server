import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { object, string } from 'yup';
import { UserInputError, inputValidation, validateConsumerViaAccessKey } from '../../graphql/resolver-middleware';


const schemaValidation = object().shape({
  access_key: string().required()
})

const resolvers = {
  Query: {
    getConsumer: async (_, __, { client_referer, ValidationConsumer }) => {
      
      const exp = new RegExp(ValidationConsumer.website_domain)
      if(!exp.test(client_referer)){
        throw new UserInputError('Invalid Access Key')
      }
      
      return ValidationConsumer
    }
  }
}

const resolversComposition = {
  'Query.getConsumer': [validateConsumerViaAccessKey(), inputValidation(schemaValidation)],
};

export default composeResolvers(resolvers, resolversComposition);

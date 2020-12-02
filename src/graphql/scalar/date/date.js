import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import moment from 'moment';

export default {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return moment(value).format('YYYY-MM-DD'); // value from the client
    },
    serialize(value) {
      return moment(value).format('MM/DD/YYYY HH:mm:ss A');  // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return moment(+ast.value) // ast value is always in string format
      }
      return null;
    },
  }),
};
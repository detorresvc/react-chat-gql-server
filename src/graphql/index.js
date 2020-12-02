import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeType, mergeResolvers } from '@graphql-tools/merge';

import usersResolvers from './resolvers/users';
import roomssResolvers from './resolvers/rooms';
import messagesResolvers from './resolvers/messages';

import pageInfoType from './types/PageInfo.gql';
import usersType from './types/users.gql';
import roomsType from './types/rooms.gql';
import consumersType from './types/consumers.gql';
import messagesType from './types/messages.gql';

import query from './types/query.gql';
import mutation from './types/mutation.gql';
import subscription from './types/subscriptions.gql';

import Date from './scalar/date/date';
import DateType from './scalar/date/date.gql';

import FloatWithDefaultValue from './scalar/FloatWithDefaultValue/FloatWithDefaultValue';
import FloatWithDefaultValueType from './scalar/FloatWithDefaultValue/FloatWithDefaultValue.gql';


const typeDefs = mergeType([
  pageInfoType,
  DateType,
  FloatWithDefaultValueType,
  consumersType,
  usersType,
  roomsType,
  messagesType,

  query,
  mutation,
  subscription
]);

const resolvers = mergeResolvers([
  
  usersResolvers,
  roomssResolvers,
  messagesResolvers,
  Date,
  FloatWithDefaultValue
]);

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});

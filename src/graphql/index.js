import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeType, mergeResolvers } from '@graphql-tools/merge';
import {
  GraphQLUpload as Upload, // The GraphQL "Upload" Scalar
  graphqlUploadExpress, // The Express middleware.
} from 'graphql-upload';

import usersResolvers from './resolvers/users';
import roomssResolvers from './resolvers/rooms';
import messagesResolvers from './resolvers/messages';
import attachmentResolvers from './resolvers/attachments';
import consumerResolvers from './resolvers/consumers';

import fileType from './types/file.gql';
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

import UploadType from './scalar/upload/upload.gql';


const typeDefs = mergeType([
  pageInfoType,
  DateType,
  FloatWithDefaultValueType,
  UploadType,
  consumersType,
  usersType,
  roomsType,
  messagesType,
  fileType,

  query,
  mutation,
  subscription
]);

const resolvers = mergeResolvers([
  consumerResolvers,
  usersResolvers,
  roomssResolvers,
  messagesResolvers,
  attachmentResolvers,
  Date,
  FloatWithDefaultValue
]);

export default makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...resolvers,
    Upload
  },
});

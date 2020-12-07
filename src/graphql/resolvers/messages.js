import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { object, string, number } from 'yup';
import { inputValidation, privateResolver, UserInputError,  } from '../../graphql/resolver-middleware';
import { PubSub, withFilter } from 'apollo-server-express';
import { sortBy } from 'lodash';

const pubsub = new PubSub();
const MESSAGE_ADDED = 'MESSAGE_ADDED';
const ROOM_UPDATED = 'ROOM_UPDATED'

const schemaValidation = object().shape({
  room_id: number().required(),
  message: string().required()
})

const resolvers = {
  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(MESSAGE_ADDED),
        (payload, variables) => {
          return +payload.messageAdded.room_id === +variables.room_id
        }
      ) 
    },
    roomUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(ROOM_UPDATED),
        (payload) => {
          return +payload.auth.id === +payload.roomUpdated.user_id
        }
      )
    }
  },
  Mutation: {
    createMessage: async (_, args, { auth, models }) => {
      const { Message, Room } = models
      
      await new Room({ id: args.room_id  }).fetch({ require: false })
        .then(async (m) => {
          const serializedRoom = m.serialize()
          if(!m)
            throw new UserInputError('Room Doesnt Exist')
          if(!auth.is_main && +auth.id !== +serializedRoom.user_id){
            throw new UserInputError('User Doesnt Exist')
          }

         await m.save({ updated_at: new Date() }, { method: 'UPDATE' }).tap(async room => {

          return await room.related('messages').create({
            user_id: auth.id,
            message: args.message
          }).then(async mssg => {

            const messageAdded = await new Message({ id: mssg.id })
              .fetch({ require: false, withRelated: ['user', 'attachments'] })
              .then(res => res.serialize())

            if(mssg){
              await pubsub.publish(MESSAGE_ADDED, { messageAdded });

              const roomUpdated = await new Room({ id: args.room_id  })
              .fetch({ require: false, withRelated: ['latest_message'] })
              .then(res => res.serialize())

              await pubsub.publish(ROOM_UPDATED, { roomUpdated, auth });
            }
          })
         })
        })
      return true
    }
  },
  Query: {
    roomMessages: async (_, args, { models }) => {
      const { Room } = models
      
      const response = await new Room({ id: args.room_id })
        .fetch({ 
          require: false 
        })
        .then(function(m){
          return m.related('messages').orderBy('created_at', 'DESC')
          .fetchPage({ page: args.page || 1, pageSize: 15, withRelated: ['user', 'attachments'] })
          .then(function(result){
            
            return {
              result,
              pagination: result.pagination
            }
          })
        })
        .then(function(m){
          return {
            messages: sortBy(m.result.serialize(), ['created_at', 'DESC']),
            pagination: m.pagination
          }
        })
        
      return response
    }
  }
}

const resolversComposition = {
  'Mutation.createMessage': [privateResolver(), inputValidation(schemaValidation)],
  'Query.roomMessages': [privateResolver()],
  'Subscription.messageAdded': [privateResolver()],
  'Subscription.roomUpdated': [privateResolver()]
};

export default composeResolvers(resolvers, resolversComposition);

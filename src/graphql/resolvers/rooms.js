import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { privateResolver, UserInputError } from '../../graphql/resolver-middleware';
import { PubSub } from 'apollo-server-express';

const pubsub = new PubSub();
const ROOM_ADDED = 'ROOM_ADDED';

const resolvers = {
  Subscription: {
    roomAdded: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([ROOM_ADDED]),
    },
  },
  Mutation: {
    createRoom: async (_, __, { models, auth }) => {
      const { Room, User } = models

      const isRoomExist = await new Room({ user_id: auth.id }).fetch({ require: false })

      if(!isRoomExist){
        const response = await new Room().save({ name: auth.name, user_id: auth.id })
        await new User({ id: auth.id }).rooms().attach(response)
        const consumer = await new User({ consumer_id: auth.consumer_id, is_main: 1 }).fetch({ require: false })
        response.users().attach(consumer)
        pubsub.publish(ROOM_ADDED, { roomAdded: response.serialize() });
        return response && response.serialize()
      }
      
      return null
    },
    addUserToRoom: async (_, args, { models, auth }) => {
      const { Room, User } = models

      const room = await new Room({ id: args.id, user_id: auth.id }).fetch({ require: false })
      if(!room)
        throw new UserInputError('Room Doesnt Exist')
      
      const user = await new User({ id: args.user_id }).fetch({ require: false })
      if(!user)
        throw new UserInputError('User Doesnt Exist')
  
      await user.rooms().attach(room)  

      return room && room.serialize()
    }
  },
  Query: {
    userRooms: async (_, args, { models, auth }) => { 
      const { User } = models
      const response = await new User({ id: auth.id }).fetch({
        withRelated: [
          'rooms', 
          {
            'rooms.latest_message': (mssg) => mssg
          }
        ]
      });
      
      const serializeData =  response.serialize()
      return serializeData.rooms
    }
  }
}

const resolversComposition = {
  'Mutation.createRoom': [privateResolver()],
  'Mutation.addUserToRoom': [privateResolver()],
  'Query.userRooms': [privateResolver()],
  'Subscription.roomAdded': [privateResolver()]
};

export default composeResolvers(resolvers, resolversComposition);
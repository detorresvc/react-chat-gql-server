import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { object, string, number } from 'yup';
import { inputValidation, privateResolver, uploadSizeValidation, fileTypesValidation } from '../../graphql/resolver-middleware';
import { PubSub } from 'apollo-server-express';


const pubsub = new PubSub();
const ATTACHMENT_MESSAGE_ADDED = 'ATTACHMENT_MESSAGE_ADDED';
const ATTACHMENT_ROOM_UPDATED = 'ATTACHMENT_ROOM_UPDATED'

const { createWriteStream, unlink, readFileSync, statSync } = require('fs');

const UPLOAD_DIR = './src/uploads';

const schemaValidation = object().shape({
  room_id: number().required(),
  // message: string().required()
})

const uploadFile = async (stream, path) => {
  // Store the file in the filesystem.
  return await new Promise((resolve, reject) => {

    const writeStream = createWriteStream(path);
    writeStream.on('finish', resolve);
    writeStream.on('error', (error) => {
      unlink(path, () => {
        reject(error);
      });
    });
    stream.on('error', (error) => writeStream.destroy(error));
    stream.pipe(writeStream);
  });
}


const resolvers = {
  Subscription: {
    messageAttachmentAdded: {
      subscribe: () => pubsub.asyncIterator([ATTACHMENT_MESSAGE_ADDED]),
    },
    roomAttachmentUpdated: {
      subscribe: () => pubsub.asyncIterator([ATTACHMENT_ROOM_UPDATED]),
    }
  },
  Mutation: {
    createAttachment: async (_, args, { auth, models }) => {
      const { Message, Room, Attachment } = models
      
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
            message: 'attachment'
          }).then(async mssg => {

            if(mssg){
              
              await Promise.all(args.files.map(async (file) => {
                const { createReadStream, filename, mimetype, encoding } = await file
                const stream = createReadStream();
                
                const path = `${UPLOAD_DIR}/${filename}`;
        
                await new Attachment().save({
                  filename,
                  mimetype,
                  encoding,
                  path,
                  message_id: mssg.id
                })
        
                await uploadFile(stream, path) 
              }))

              const messageAttachmentAdded = await new Message({ id: mssg.id })
              .fetch({ require: false, withRelated: ['user', 'attachments'] })
              .then(res => res.serialize())
              
              await pubsub.publish(ATTACHMENT_MESSAGE_ADDED, { messageAttachmentAdded });

              const roomAttachmentUpdated = await new Room({ id: args.room_id  })
              .fetch({ require: false, withRelated: ['latest_message'] })
              .then(res => res.serialize())

              await pubsub.publish(ATTACHMENT_ROOM_UPDATED, { roomAttachmentUpdated });
            }
          })
         })
        })
      return true
    },
  },
  Query: {
    viewImage: async (_, args, { models }) => {
      const { Attachment } = models

      const file = await new Attachment({ id: args.id }).fetch({ require: false })
        .then((data) => {
          return data.serialize()
        })

      let img = readFileSync(file.path);
      img = new Buffer(img, "binary").toString("base64");
      
      return img
    }
  }
}

const resolversComposition = {
  'Query.viewImage': [privateResolver()],
  'Mutation.createAttachment': [privateResolver(), inputValidation(schemaValidation), uploadSizeValidation(5), fileTypesValidation()],
  'Subscription.messageAttachmentAdded': [privateResolver()],
  'Subscription.roomAttachmentUpdated': [privateResolver()]
};

export default composeResolvers(resolvers, resolversComposition);


import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const {
  UserInputError,
  ForbiddenError,
  AuthenticationError

} = require('apollo-server');
const SECRET = 'mysecret'

export {
  UserInputError,
  ForbiddenError,
  AuthenticationError
}
// export const isUserExist = () => next => async (root, args, context, info) => {

// }

export const isUserExistAndValidPassword = () => next => async (root, args, context, info) => {
  
  const { email, password } = args
  const { User } = context.models
  
  const response =  await new User().
    where({ email, is_main: 1 })
    .fetch({ require: false })

  const user = response && response.serialize()
  
  if(!user)
    throw new AuthenticationError('Invalid email or password')

  const match = await bcrypt.compare(password, user.password);
  
  if(!match)
    throw new AuthenticationError('Invalid email or password')

  

  return next(root, { ...args, id: user.id }, context, info);
}

export const privateResolver = () => next => async (root, args, context, info) => {
  
  const bearer = context.token.split(' ');
  const token = bearer[1];
  const User = context.models.User
  
  if(!token)
    throw new ForbiddenError('Access Denied!')

  try{
    const isVerified = await jwt.verify(token, SECRET)
    
    if(!isVerified)
      throw new ForbiddenError('Access Denied!')
  }catch(e){
    throw new ForbiddenError('Access Denied!')
  }

  const verifiedToken = jwt.verify(token, SECRET)
  
  const auth = await new User({ id: verifiedToken.id }).fetch({ require: false })
  
  return next(root, args, { auth: auth.serialize(), ...context }, info);
}


export const inputValidation = (schema) => next =>  async (root, args, context, info) => {
  
  await schema.validate(args).catch(x => {
    throw new UserInputError(x.errors)
  })
  
  return next(root, args, context, info);
}


const getAllFileSize = async (files) => {
  return await Promise.all(files.map(async (file) => {
    return await new Promise(async resolve => {
      const { createReadStream } = await file
      const stream = await createReadStream()
      return await stream.on('data', async chunk => {
        
        return await resolve(chunk.length)
      })
    })
  }))
}

export const uploadSizeValidation = (limit) => next => async (root, args, context, info) => {

  const arrayOfFileSize = await getAllFileSize(args.files)
  const totalFileSize = arrayOfFileSize.reduce((current, accumulator) => {
    return current+accumulator
  }, 0)
  
  const limitSizeToByte = limit*1000000 

  
  if(totalFileSize > limitSizeToByte){
    throw new UserInputError(`Allowed Upload limit ${limit}MB only`)
  }

  return next(root, args, context, info);
}

export const fileTypesValidation = () => next => async (root, args, context, info) => {

  const arrayOfBoleanTypes = await Promise.all(args.files.map(async (file) => {
    const {  mimetype } = await file
    if(/(jpeg|png|gif|mp4|x-msvideo|quicktime|x-ms-wmv)/g.test(mimetype))
      return true
    return false

  }))
  
  const isValid = arrayOfBoleanTypes.every(x => x)
  if(!isValid){
    throw new UserInputError(`Selected file is invalid`)
  }

  return next(root, args, context, info);
}
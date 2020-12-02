
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
    where({ email })
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

  const auth = await new User({ id: verifiedToken.id }).fetch()
  
  return next(root, args, { auth: auth.serialize(), ...context }, info);
}


export const inputValidation = (schema) => next =>  async (root, args, context, info) => {
  
  await schema.validate(args).catch(x => {
    throw new UserInputError(x.errors)
  })
  
  return next(root, args, context, info);
}

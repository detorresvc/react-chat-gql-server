import bookshelf from '../config';

const Message = bookshelf.model('Message', {
  tableName: 'messages',
  hasTimestamps: true,
  user(){
    return this.belongsTo('User')
  }
});

export default Message;

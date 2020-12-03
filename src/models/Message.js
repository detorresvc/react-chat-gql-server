import bookshelf from '../config';

const Message = bookshelf.model('Message', {
  tableName: 'messages',
  hasTimestamps: true,
  user(){
    return this.belongsTo('User')
  },
  attachments(){
    return this.hasMany('Attachment')
  }
});

export default Message;

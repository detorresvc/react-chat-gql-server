import bookshelf from '../config';

const Room = bookshelf.model('Room', {
  tableName: 'rooms',
  hasTimestamps: true,
  users() {
    return this.belongsToMany('User')
  },
  latest_message(){
    return this.hasOne('Message').orderBy('updated_at', 'DESC')
  },
  messages(){
    return this.hasMany('Message')
  }
});

export default Room;

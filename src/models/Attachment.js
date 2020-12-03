import bookshelf  from '../config';

const Attachment = bookshelf.model('Attachment', {
  tableName: 'attachments',
});

export default Attachment;

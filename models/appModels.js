// User and Thread model - appModels.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String },
  bio: { type: String },
  link: { type: String },
  inbox: [{ type: Schema.Types.ObjectId, ref: 'Thread' }], 
});
// Virtual property for profile URL/route
userSchema.virtual('profileURL').get(function() {
  return '/' + this.credentials.username;
});

const User = mongoose.model('User', userSchema, 'users');

const threadSchema = new Schema({
  party: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    author: { type: String, required: true }, 
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
});
// Virtual property for thread URL/route
threadSchema.virtual('threadURL').get(function() {
  return '/thread/' + this._id;
});

const Thread = mongoose.model('Thread', threadSchema, 'threads');

module.exports = { User, Thread };
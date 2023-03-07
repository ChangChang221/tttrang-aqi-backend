const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

// userSchema.pre('save', function (next) {
//   const user = this;
//   if (!user.isModified('password')) return next();

//   bcrypt.hash(user.password, 10, (err, hash) => {
//     if (err) return next(err);
//     user.password = hash;
//     next();
//   });
// });

// userSchema.methods.comparePassword = function (password, callback) {
//   bcrypt.compare(password, this.password, (err, result) => {
//     if (err) return callback(err);
//     callback(null, result);
//   });
// };

const user = mongoose.model('user', userSchema);

module.exports = user;
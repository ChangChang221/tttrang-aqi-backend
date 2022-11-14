//Require Mongoose

var mongoose = require('mongoose');

var historySchema = new mongoose.Schema({
  name: {
    type: String
  },
  pm25: {
    type: String
  },
  date: {
    type: Date
  },
  temperature: {
    type: String
  },
  humidity: {
    type: String
  },
  co2: {
    type: String
  },
  co: {
    type: String
  },
  AQI:{
    type: String
  }
}, {
  collection: 'history'
});
var history = mongoose.model('history', historySchema );
module.exports = history;
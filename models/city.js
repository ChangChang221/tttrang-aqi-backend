//Require Mongoose
const { Double } = require('mongodb');
var mongoose = require('mongoose');

var citySchema = new mongoose.Schema({
  name: {
    type: String
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
  pm25: {
    type: String
  },
  pm10: {
    type: String
  },
  AQI:{
    type: String
  }
}, {
  collection: 'city'
});
var city = mongoose.model('city', citySchema );
module.exports = city;
//Require Mongoose
const { Double } = require('mongodb');
const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String , 
    required: true,
    unique: true
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
  },
  img:{
    type: String
  },
  lat:{
    type: Number
  },
  lng:{
    type: Number
  }
}, {
  collection: 'city'
});

const city = mongoose.model('city', citySchema );

module.exports = city;
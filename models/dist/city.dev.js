"use strict";

//Require Mongoose
var _require = require('mongodb'),
    Double = _require.Double;

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
  AQI: {
    type: String
  }
}, {
  collection: 'city'
});
var city = mongoose.model('city', citySchema);
module.exports = city;
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var city = new Schema({
  name : String,
  country : String,
})

var flat = new Schema({
  name : String,
  description : String,
  address :  String,
  city : String
})

var schemas = {}

schemas.getCurrent = function(){}

module.exports = schemas;

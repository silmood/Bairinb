var express = require('express')
var swig = require('swig')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var uuid = require('uuid')
var Schema = mongoose.Schema

var app = express()

app.engine('html', swig.renderFile)
app.set('view engine', 'html')
app.set('views', __dirname + '/views')
app.use(bodyParser.urlencoded({extended:false}))

app.set('view_cache', false)
swig.setDefaults({cache : false})

mongoose.connect('mongodb://localhost/bairinb')

var city = new Schema({
  uuid: {type:String, default: uuid.v4},
  name : String,
  country : String,
})

var advert = new Schema({
  uuid: {type:String, default: uuid.v4},
  name : String,
  description : String,
  address :  String,
  city_uuid: String
})

var City = mongoose.model('City', city)
var Advert = mongoose.model('Advert', advert)

app.get('/', function(request, response){

  City.find({}, function (err, docs){
    if(err){
      return response.send(500, 'Internal Server Error')
    }

    response.render('index', {title : 'Bairinb', cities : docs})

  })
})

app.get('/add-listing', function(request, response){
  City.find({}, function (err, docs){
    if(err){
      return res.send(500, 'Internal Server Error')
    }
    response.render('add-listing', {title : 'Bairinb', cities : docs})
  })
})

app.post('/submit-advert', function(request, response){
  Advert.create(request.body, function(err, doc){
    if (err) {
      response.send(500, 'Internal Server Error')
    }
    response.redirect('/')
  })
})

app.get('/city/:uuid', function(request, response){
    Advert.find({city_uuid: request.params.uuid}, function(err, adverts){
      if (err) {
        response.send(500, 'Internal Server Error')
      }
      response.render('city-adverts', {title : 'Bairinb', adverts : adverts})
  })
})

app.get('/advert/:uuid', function(request, response){
  Advert.findOne({uuid : request.params.uuid}, function(err, advert){
    if (err) {
      response.send(500, 'Internal Server Error')
    }

    City.findOne({uuid : advert.city_uuid}, function(err, city){
      if (err) {
        response.send(500, 'Internal Server Error')
      }

      response.render('advert', {title : 'Bairinb', advert : advert, city : city})
    })
  })
})

app.post('/advert/:uuid/description', function(request, response){
  Advert.findOne({uuid : request.params.uuid}, function(err, advert){
    if (err) {
      response.send(500, 'Internal Server Error')
    }
    advert.description = request.body.description;
    advert.save(function(err){
      if (err) {
        response.send(500, 'Internal Server Error')
      }

      response.redirect('/advert/' + request.params.uuid)
    })
  })
})

app.post('/advert/:uuid/delete', function(request, response){
  Advert.findOne({uuid : request.params.uuid}, function(err, advert){
    if (err) {
      response.send(500, 'Internal Server Error')
    }

    advert.remove(function(error){
      if (err) {
        response.send(500, 'Internal Server Error')
      }

      response.redirect('/')
    })
  })
})


app.listen(3000, function(){
    console.log('Server ready!')
})

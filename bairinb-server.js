'use strict';

var express = require('express')
var swig = require('swig')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var uuid = require('uuid')
var bcrypt = require('bcrypt-nodejs')
var Schema = mongoose.Schema
var path = require('path')

var session = require('express-session')
var MongoStore = require('express-session-mongo')
var flash = require('flash')

var app = express()

app.engine('html', swig.renderFile)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'views'))
app.use(bodyParser.urlencoded({extended:false}))
app.use(session({
	secret: 'keyboard cat',
	store: new MongoStore(),
	saveUninitialized: true,
	resave: true
}))

app.use( flash() )
app.set('view_cache', false)
swig.setDefaults({cache : false})

mongoose.connect('mongodb://localhost/bairinb')

var userSchema = Schema({
	username: String,
	displayName: String,
	password: String,
	uuid : {type: String, default: uuid.v4}
})

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

var User = mongoose.model('User', userSchema)
var City = mongoose.model('City', city)
var Advert = mongoose.model('Advert', advert)

app.use(function (req, res, next) {
	if(!req.session.userId){
		return next()
	}

	User.findOne({uuid: req.session.userId}, function(err, user){
		if(err){
			return res.send(500, 'Internal Server Error')
		}

		res.locals.user = user
		next()
	})
});

app.get('/', function(request, response){
  City.find({}, function (err, docs){
    if(err){
      return response.send(500, 'Internal Server Error')
    }

    response.render('index', {title : 'Bairinb', cities : docs})

  })
})

app.get('/sign-up', function (req, res){
	var error = res.locals.flash.pop()

	res.render('sign-up', {
		error: error
	})
})

app.get('/log-in', function (req, res){
	var error = res.locals.flash.pop()

	res.render('log-in',{
		error: error
	})
})

app.get('/log-out', function (req, res){
	req.session.destroy()
	res.redirect('/')
})

app.post('/sign-up', function (req, res){
	if(!req.body.username || !req.body.password){
		req.flash('sign-up-error', 'To sign up you need a username and a password')
		return res.redirect('/sign-up')
	}

	User.findOne({username: req.body.username}, function(err, doc){
		if(err){
			return res.send(500, 'Internal Server Error')
		}

		if(doc){
			req.flash('sign-up-error', 'Username is taken')
			return res.redirect('/sign-up')
		}

		bcrypt.hash(req.body.password, null/* Salt */, null, function(err, hashedPassword) {
			if(err){
				return res.send(500, 'Internal Server Error')
			}

			User.create({
				username: req.body.username,
				password: hashedPassword
			}, function(err, doc){
				if(err){
					return res.send(500, 'Internal Server Error')
				}

				req.session.userId = doc.uuid
				res.redirect('/')
			})
		});
	})
})

app.post('/log-in', function (req, res){
	if(!req.body.username || !req.body.password){
		req.flash('log-in-error', 'To log in you need a username and a password')
		return res.redirect('/log-in')
	}

	User.findOne({username: req.body.username}, function(err, doc){
		if(err){
			return res.send(500, 'Internal Server Error')
		}

		if(!doc){
			req.flash('log-in-error', 'Invalid user')
			return res.redirect('/log-in')
		}

		bcrypt.compare(req.body.password, doc.password, function(err, result){
			if(err){
				return res.send(500, 'Internal Server Error')
			}

			req.session.userId = doc.uuid
			res.redirect('/')
		})
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

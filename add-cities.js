var inquirer = require('inquirer')
var mongoose = require('mongoose')
var uuid = require('uuid')
var Schema = mongoose.Schema

mongoose.connect('mongodb://localhost/bairinb')

var city = new Schema({
  uuid: {type:String, default: uuid.v4},
  name : String,
  country : String,
})

var City = mongoose.model('City', city)

inquirer.prompt([
    {
        type : 'input',
        name : 'name',
        message : '¿Cuál es el nombre de esta ciudad'
    },
    {
        type : 'input',
        name : 'country',
        message : '¿Cuál es el país de esta ciudad?'
    }

], function(answers){

    City.create(answers, function(err, doc){
            if(err){
                console.log('Hubo error', err)
                return
            }

            console.log('City was created')
        })
    })

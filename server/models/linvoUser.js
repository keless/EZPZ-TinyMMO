//const linvoDB = require('linvodb3')
//const uuidv4 = require('uuid/v4')
import linvoDB from 'linvodb3'
//import uuid from 'uuid'
//const uuidv4 = uuid.v4
import { uuidv4 } from '../../static/shared/EZPZ/ext/uuid.js'
var modelName = "user"

var options = { filename: "./db/users.db", autoload:true }

var schema = {
    name: String,
    email: {
        type: String,
        index: true,
        unique: true
    },
    password: String,
    date: {
        type: "date",
        default: Date.now
    }
}

var User = new linvoDB(modelName, schema, options)



//module.exports = User
export default User
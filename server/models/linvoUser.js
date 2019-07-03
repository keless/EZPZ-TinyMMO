const linvoDB = require('linvodb3')
const uuidv4 = require('uuid/v4')
var modelName = "user"

var options = { filename: "./db/users.db" }

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



module.exports = User
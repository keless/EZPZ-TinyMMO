const linvoDB = require('linvodb3')
const uuidv4 = require('uuid/v4')

const { EntitySchema, EntityModel } = require('./shared/models/EntityModel.js')

var options = { filename: "./db/game.db" }

var playerSchema = {
    name: String,
    userID: {
        type: String,
        unique: true
    },
    password: String,
    date: {
        type: "date",
        default: Date.now
    }
}

var characterSchema = {
    name: String,
    level: String,
    currHP: String,
    owner: String, //corresponds to playerSchema.userID
    pos: {
        x: Number,
        y: Number
    }
}

var gameSchema = {
    date: {
        type: Date,
        default: Date.now
    },
    entities:[EntitySchema]
}

var Player = new linvoDB("player", playerSchema, options)
var Game = new linvoDB("game", gameSchema, options)


module.exports = { Player, Game }
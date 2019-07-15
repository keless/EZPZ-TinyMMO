//const linvoDB = require('linvodb3')
//const uuidv4 = require('uuid/v4')
//const { EntitySchema, EntityModel } = require('../../shared/model/EntityModel')
import linvoDB from 'linvodb3'
//import uuid from 'uuid'
//const uuidv4 = uuid.v4
import { uuidv4 } from '../../static/shared/EZPZ/ext/uuid.js'
//const uuidv4 = require('uuid/v4')
import { EntitySchema, EntityModel } from '../../static/shared/model/EntityModel.js'

var options = { filename: "./db/game.db" }

var gameSchema = {
    date: {
        type: Date,
        default: Date.now
    },
    entities:[EntitySchema],
    testEntity: EntitySchema
}

var Game = new linvoDB("game", gameSchema, options)


//module.exports = { Player, Game }
export default Game
export { Game }
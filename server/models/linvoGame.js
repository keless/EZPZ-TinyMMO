import linvoDB from 'linvodb3'
//import { uuidv4 } from '../../static/shared/EZPZ/ext/uuid.js'
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

export default Game
export { Game }
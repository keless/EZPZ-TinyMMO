import linvoDB from 'linvodb3'
//import { uuidv4 } from '../../static/shared/EZPZ/ext/uuid.js'
import { EntitySchema, EntityModel } from '../../static/shared/model/EntityModel.js'

var options = { filename: "./db/game.db" }

var EntityDoc = new linvoDB('', EntitySchema, { autoLoad:false })

var gameSchema = {
    date: {
        type: Date,
        default: Date.now
    },
    
    // entities:[EntitySchema], // Hack: dont define this in schema and it will work -__-'

}

var Game = new linvoDB("game", gameSchema, options)

export default Game
export { Game }
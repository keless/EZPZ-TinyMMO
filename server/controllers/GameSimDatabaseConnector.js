
import {Game} from '../models/linvoGame.js'
//import {EntityModel, EntitySchema} from '../../static/shared/model/EntityModel.js'
import { isArray } from '../../static/shared/EZPZ/Utility.js';
import GameSim from '../../static/shared/controller/GameSim.js'

var g_instance = null

class GameSimDatabaseConnector {
    constructor( ){
        this.gameDB = new GameSim()
    }

    static get instance() {
        if (!g_instance) {
            g_instance = new GameSimDatabaseConnector()
        }

        return g_instance
    }

    startupFromDB( fnCompletion ) {
        console.log("startupFromDB")
        Game.findOne({}, (err, doc)=>{
            if (!err && doc) {
                if (isArray(doc)) {
                    doc = doc[0]
                }
    
                console.log("loaded existing gameDB instance")
                this.gameDB = doc
    
                var numEntities =   this.gameDB.entities.length
                console.log(`loaded ${numEntities} entities`)
            } else {
                console.log("Created new gameDB instance")
                this.gameDB = new Game({_id:'gameID'})
            }

            this._initGameSimFromDB()

            if (fnCompletion) {
                fnCompletion()
            }
        })
    }

    _initGameSimFromDB() {
        var gameSim = GameSim.instance

        console.log("initGameSimFromDB")

        var entitySchemas = this.gameDB.entities
        if (entitySchemas) {
            entitySchemas.forEach((entitySchema)=>{
                console.log("init entity")
                gameSim.updateEntityFromJson(entitySchema)
            })
        }
    }

    flushToDB() {
        console.log("flushToDB")

        var gameSim = GameSim.instance
        if (!gameSim.dirty) {
            return  // no changes to flush
        }

        // does this trigger re-saving the entire entity list every time? or is it smart enough to delta?
        this.gameDB.entities = []
        gameSim.entities.forEach((entity)=>{
            console.log("get schema for object")
            var schemaObject = {}
            entity.writeToSchema(schemaObject)
            this.gameDB.entities.push(schemaObject)
        })

        this.gameDB.save((err)=>{
            if (err) {
                console.log("Write error")
            } else {
                console.log("game saved ")
            }
        })
    }
}

export default GameSimDatabaseConnector

import {Game} from '../models/linvoGame.js'
//import {EntityModel, EntitySchema} from '../../static/shared/model/EntityModel.js'
import { isArray } from '../../static/shared/EZPZ/Utility.js'
import GameSim from '../../static/shared/controller/GameSim.js'
import { CastCommandTime } from '../../static/shared/EZPZ/castengine/CastWorldModel.js'
import ServerProtocol from '../networking/protocol.js';
import {performance} from 'perf_hooks'

var g_instance = null

class GameSimDatabaseConnector {
    constructor( ){
        this.flagShutdown = false
        this.updateFreq = 1000/30  // 30 fps
        this.lastUpdate = performance.now()
        this.gameDB = null
        this.gameSim = GameSim.instance
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
        console.log("initGameSimFromDB")
        this.gameSim = new GameSim()

        var entitySchemas = this.gameDB.entities
        if (entitySchemas) {
            entitySchemas.forEach((entitySchema)=>{
                this.gameSim.updateEntityFromJson(entitySchema)
            })
        }

        this.update()
    }

    flushToDB() {
        console.log("flushToDB")

        var gameSim = this.gameSim
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

    update() {
        var currDelta = performance.now() - this.lastUpdate
        var numLoopsToPerform = (currDelta / this.updateFreq) + 1

        // perform update ticks
        for (var i=0; i<numLoopsToPerform; i++) {
            CastCommandTime.UpdateDelta(this.updateFreq)
            //update game timer
            this.gameSim.updateStep(CastCommandTime.Get(), this.updateFreq)
        }

        //xxx todo: send world update
        //console.log("broadcast world update ")
        var updateJson = this.gameSim.getWorldUpdate()
        ServerProtocol.instance.broadcast("worldUpdate", updateJson)

        // set up next update timer
        if (!this.flagShutdown) {
            setTimeout(() => {
                this.update()
            }, this.updateFreq);
        }
    }
}

export default GameSimDatabaseConnector
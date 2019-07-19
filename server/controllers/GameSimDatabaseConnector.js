import fs from 'fs'
import {Game} from '../models/linvoGame.js'
//import {EntityModel, EntitySchema} from '../../static/shared/model/EntityModel.js'
import { isArray, SlidingWindowBuffer } from '../../static/shared/EZPZ/Utility.js'
import GameSim from '../../static/shared/controller/GameSim.js'
import { CastCommandTime } from '../../static/shared/EZPZ/castengine/CastWorldModel.js'
import ServerProtocol from '../networking/protocol.js';
import {performance} from 'perf_hooks'

var g_instance = null

//xxx todo: refactor -- this isnt just about database (its more like the server-side analogy of ClientGame.js right now)
class GameSimDatabaseConnector {
    constructor() {
        this.verbose = true

        this.flagShutdown = false
        this.updateFreqMS = 1000 / 30.0 // 30 fps
        this.lastUpdateMS = performance.now()
        this.gameDB = null
        this.gameSim = GameSim.instance

        this.worldUpdateIdx = 0
        this.worldUpdateBuffer = new SlidingWindowBuffer(10)
    }

    static get instance() {
        if (!g_instance) {
            g_instance = new GameSimDatabaseConnector()
        }

        return g_instance
    }

    _log(text) {
        if (this.verbose) {
            console.log(text)
        }
    }

    startupFromDB( fnCompletion ) {
        this._log("startupFromDB")
        Game.findOne({}, (err, doc)=>{
            if (!err && doc) {
                if (isArray(doc)) {
                    doc = doc[0]
                }
    
                this._log("loaded existing gameDB instance")
                this.gameDB = doc
    
                var numEntities =   this.gameDB.entities.length
                this._log(`loaded ${numEntities} entities`)
            } else {
                this._log("Created new gameDB instance")
                this.gameDB = new Game({_id:'gameID'})
            }

            this._initGameSimFromDB()

            if (fnCompletion) {
                fnCompletion()
            }
        })
    }

    _initGameSimFromDB() {
        this._log("initGameSimFromDB")
        this.gameSim = new GameSim()
        
        //load json
        console.log("read raw data")
        let rawdata = fs.readFileSync('./static/gfx/levels/test.json');
        console.log("parse as json")
        let levelJson = JSON.parse(rawdata);
        console.log("load map from json")
        this.gameSim.LoadMapFromJson(levelJson, true)

        var entitySchemas = this.gameDB.entities
        if (entitySchemas) {
            entitySchemas.forEach((entitySchema)=>{
                this.gameSim.updateEntityFromJson(entitySchema)
            })
        }

        this.update()
    }

    flushToDB(cb) {
        this._log("flushToDB")

        var gameSim = this.gameSim
        if (!gameSim.dirty) {
            return  // no changes to flush
        }

        // does this trigger re-saving the entire entity list every time? or is it smart enough to delta?
        this.gameDB.entities = []
        gameSim.entities.forEach((entity)=>{
            this._log("get schema for object")
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
            if (cb) {
                cb(err)
            }
        })
    }

    update() {
        var currentTimeMS = performance.now()
        var currDeltaMS = currentTimeMS - this.lastUpdateMS
        var numLoopsToPerform = Math.min((currDeltaMS / this.updateFreqMS), 1)

        if (numLoopsToPerform > 2) {
            this._log("WARN: performing many loops! " + numLoopsToPerform)
        }

        // perform update ticks
        var updatePeriodS = this.updateFreqMS / 1000.0
        for (var i=0; i<numLoopsToPerform; i++) {
            CastCommandTime.UpdateDelta(updatePeriodS)
            //update game timer
            this.gameSim.updateStep(CastCommandTime.Get(), updatePeriodS)
        }

        this.lastUpdateMS = currentTimeMS

        //xxx todo: decouple worldUpdate tick rate from gameSim tick rate
        var updateJson = this.gameSim.getWorldUpdate()
        updateJson.worldUpdateIdx = this.worldUpdateIdx++
        ServerProtocol.instance.broadcast("worldUpdate", updateJson)
        this.worldUpdateBuffer.push(updateJson)

        // set up next update timer
        if (!this.flagShutdown) {
            let timerPeriodMS = this.updateFreqMS
            setTimeout(() => {
                this.update()
            }, timerPeriodMS);
        }
    }
}

export default GameSimDatabaseConnector
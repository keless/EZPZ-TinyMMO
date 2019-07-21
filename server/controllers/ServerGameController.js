import fs from 'fs'
import {Game} from '../models/linvoGame.js'
//import {EntityModel, EntitySchema} from '../../static/shared/model/EntityModel.js'
import { isArray, SlidingWindowBuffer } from '../../static/shared/EZPZ/Utility.js'
import GameSim from '../../static/shared/controller/GameSim.js'
import { CastCommandTime } from '../../static/shared/EZPZ/castengine/CastWorldModel.js'
import ServerProtocol from '../networking/ServerProtocol.js';
import {performance} from 'perf_hooks'
import fossilDelta from 'fossil-delta'

var g_instance = null

class ServerGameController {
    constructor() {
        this.verbose = true

        this.flagShutdown = false
        this.updateFreqMS = 1000 / 30.0 // 30 fps
        this.lastUpdateMS = performance.now()

        this.worldUpdateFreqMS = 1000 / 15.0 // 15 updates per second
        this.lastWorldUpdateMS = performance.now()

        this.gameDB = null
        this.gameSim = GameSim.instance

        this.worldUpdateIdx = 0
        this.worldUpdateBuffer = new SlidingWindowBuffer(10)
    }

    static get instance() {
        if (!g_instance) {
            g_instance = new ServerGameController()
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
        let rawdata = fs.readFileSync('./static/gfx/levels/test2.json');
        let levelJson = JSON.parse(rawdata);
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

        if (currentTimeMS - this.lastWorldUpdateMS > this.worldUpdateFreqMS) {
            this.sendWorldUpdateDelta()
            this.lastWorldUpdateMS = currentTimeMS
        }
        
        // set up next update timer
        if (!this.flagShutdown) {
            let timerPeriodMS = this.updateFreqMS
            setTimeout(() => {
                this.update()
            }, timerPeriodMS);
        }
    }

    sendWorldUpdateDelta() {
        var worldUpdateJson = this.gameSim.getWorldUpdate()
        worldUpdateJson.worldUpdateIdx = this.worldUpdateIdx++
        
        //xxx todo: refactor: move this into ServerProtocol.js
        var previousWorldUpdateJson = this.worldUpdateBuffer.getLast()
        this.worldUpdateBuffer.push(worldUpdateJson)

        var delta = null
        if (previousWorldUpdateJson) {
            // record time it takes to generate deltas for later optimization
            var pf_start = performance.now()
            delta = {}
            var u1str = JSON.stringify(previousWorldUpdateJson)
            var u2str = JSON.stringify(worldUpdateJson)
            var pf_str = performance.now()
            //generate a delta
            var encoder = new TextEncoder()
            var enc1 = encoder.encode(u1str)
            var enc2 = encoder.encode(u2str)
            var pf_delta = performance.now()
            var byteArrayDelta = fossilDelta.create(enc1, enc2)
            delta = byteArrayDelta

            var pf_finish = performance.now()

            /*
            var pf_processTotal = pf_finish - pf_start
            var pf_stringifyTotal = pf_str - pf_start
            var pf_encoderTotal = pf_delta - pf_str
            var pf_fossilDeltaTotal = pf_finish - pf_delta
            console.log(`wu tot:${pf_processTotal.toFixed(4)} str:${pf_stringifyTotal.toFixed(4)} enc:${pf_encoderTotal.toFixed(4)} dt:${pf_fossilDeltaTotal.toFixed(4)} `)
            // with 1 entity (lol), avg 0.06MS  0.023ms strings, 0.011ms encoding, 0.026ms delta
            
            var size_worldUpdate = enc2.length
            var size_delta = byteArrayDelta.length
            console.log(`wu ${size_worldUpdate} compressed to ${size_delta} - ratio ${((size_delta/size_worldUpdate)*100).toFixed(2)}%`)
            // with 6 entities only 1 moving (lol), avg world update size 2020 bytes, compressed to 50 bytes, compression ratio 98%
            */
        }

        var sendObj = {}
        if (delta != null) {
            sendObj.deltaWorldUpdate  = delta
            sendObj.deltaWorldUpdateIdx = worldUpdateJson.worldUpdateIdx
        } else {
            sendObj.fullWorldUpdate = worldUpdateJson
        }

        //xxx WIP - todo; send deltas using fossil-delta
        ServerProtocol.instance.broadcastWithBinary("worldUpdate", sendObj)
    }

    // if idx == -1, returns latest
    // if idx is not found in buffer, returns latest
    getFullWorldUpdateByIdx(idx) {
        var update = this.worldUpdateBuffer.getLast()

        if ((idx != -1) && (update.worldUpdateIdx != idx)) {
            var searchResult = this.worldUpdateBuffer.find((e)=>{
                return e.worldUpdateIdx == idx
            })

            if (searchResult) {
                update = searchResult
            }
        }

        return update
    }
}

export default ServerGameController
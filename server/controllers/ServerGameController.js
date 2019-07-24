import fs from 'fs'
import {Game} from '../models/linvoGame.js'
//import {EntityModel, EntitySchema} from '../../static/shared/model/EntityModel.js'
import { isArray } from '../../static/shared/EZPZ/Utility.js'
import { Vec2D, Rect2D } from '../../static/shared/EZPZ/Vec2D.js'
import GameSim from '../../static/shared/controller/GameSim.js'
import { CastCommandTime } from '../../static/shared/EZPZ/castengine/CastWorldModel.js'
import ServerProtocol from '../networking/ServerProtocol.js';
import {performance} from 'perf_hooks'
import { EventBus } from '../../static/shared/EZPZ/EventBus.js'

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

        this.pendingPlayerInputs = []
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
        this.gameSim = new GameSim(true)
        
        //load json
        let rawdata = fs.readFileSync('./static/gfx/levels/test2.json');
        let levelJson = JSON.parse(rawdata);
        this.gameSim.LoadMapFromJson(levelJson)

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
            if (cb) { cb(null); }
            return  // no changes to flush
        }

        // does this trigger re-saving the entire entity list every time? or is it smart enough to delta?
        this.gameDB.entities = []
        gameSim.m_allEntities.forEach((entity)=>{
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
        var numLoopsToPerform = Math.max((currDeltaMS / this.updateFreqMS), 1)

        if (numLoopsToPerform > 2) {
            this._log("WARN: performing many loops! " + numLoopsToPerform)
        }

        // perform update ticks
        var updatePeriodS = this.updateFreqMS / 1000.0
        for (var i=0; i<numLoopsToPerform; i++) {
            // update game timer
            var ct = CastCommandTime.UpdateDelta(updatePeriodS)
            
            // apply pending user inputs
            while (this.pendingPlayerInputs.length > 0 && this.pendingPlayerInputs[0].gameTime <= ct) {
                var impulseData = this.pendingPlayerInputs.shift()
                this._applyPlayerImpulse(impulseData)
                var inputDT = ct - impulseData.gameTime
                this._log(`player input process lag ${inputDT.toFixed(2)}ms`)
            }

            // run simulation tick
            this.gameSim.updateStep(ct, updatePeriodS)
        }

        this.lastUpdateMS = currentTimeMS

        if (currentTimeMS - this.lastWorldUpdateMS > this.worldUpdateFreqMS) {
            ServerProtocol.instance.sendWorldUpdate()
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

    queuePlayerImpulse(impulseData) {
        // validate data
        if (!impulseData.charID || !impulseData.ownerID || !impulseData.gameTime) {
            this._log("error: cant apply impulse, missing required field")
            return
        }
        if (!impulseData.hasOwnProperty("speed")) {
            impulseData.speed = 200 //xxx todo: get default from char?
        }
        if (!impulseData.hasOwnProperty("vecDir")) {
            impulseData.vecDir = { x: 0, y: 0 }
        } else {
            if (!impulseData.vecDir.hasOwnProperty("x")) {
                impulseData.vecDir.x = 0
            }
            if (!impulseData.vecDir.hasOwnProperty("y")) {
                impulseData.vecDir.y = 0
            }
        }

        var ct = CastCommandTime.Get()
        if (impulseData.gameTime < ct) {
            this._log(`rcvd input from ${impulseData.gameTime.toFixed(2)}ms at ${ct.toFixed(2)}ms`)
        } else {
            this._log(`rcvd input from user in time to apply to simulation correctly`)
        }

        // add to queue; this will be processed in updateTick
        this.pendingPlayerInputs.push(impulseData)
        // keep pendingPlayerInputs sorted by impulseData.gameTime (first element should be oldest gameTime)
        //xxx todo: test that sort is happening in the correct direction
        this.pendingPlayerInputs.sort((a, b)=>{
            return a.gameTime < b.gameTime
        })
    }

    _applyPlayerImpulse(impulseData) {
        var character = this.gameSim.getEntityForId(impulseData.charID)
        if (character.owner != impulseData.ownerID) {
            this._log("error: cant apply impulse to character from non-owner")
            return
        }

        var dir = new Vec2D(impulseData.vecDir.x, impulseData.vecDir.y)
        var speed = impulseData.speed
        if (impulseData.hasOwnProperty("facing")) {
            character.facing = impulseData.facing
        }

        //xxx todo: check if character can accept (if dead dont move, etc)
        character.vel = dir.getUnitized().scalarMult(speed)
    }
}

export default ServerGameController
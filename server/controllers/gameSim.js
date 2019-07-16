//const Game = require('../models/linvoGame')
//const EntityModel = require('../../shared/model/EntityModel')
import {Game} from '../models/linvoGame.js'
import {Service} from '../serverEZPZ.js'
import {EntityModel, EntitySchema} from '../../static/shared/model/EntityModel.js'
import { isArray } from '../../static/shared/EZPZ/Utility.js';

class GameSim {
    constructor() {


        this.entities = []
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

            this.startupFromDB()
        })
        

        Service.Add("gameSim", this)
    }

    startupFromDB() {
        var entitySchemas = this.gameDB.entities

        console.log("startupFromDB")
        if (entitySchemas) {
            entitySchemas.forEach((entitySchema)=>{
                console.log("load entity")
                var entity = new EntityModel()
                entity.initWithSchema(entitySchema)
                this.entities.push(entity)
            })
        }

        //todo: when complete, start update loop
    }

    flushToDB() {
        console.log("flushToDB")

        // does this trigger re-saving the entire entity list every time? or is it smart enough to delta?
        this.gameDB.entities = []
        this.entities.forEach((entity)=>{
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
        // perform physics

        // perform AI
    }

    /// @return entityID if succesful, or null otherwise
    createCharacterForUser(userId, name, race, charClass) {
        var entity = new EntityModel()

        //xxx todo: validate params
        entity.initNewCharacter(userId, name, race, charClass)
        this.entities.push(entity)

        this.flushToDB() //xxx update

        return entity.uuid
    }

    getEntityForId(entityId) {
        return this.entities.find((entity)=> {
            return entity.uuid == entityId
        })
    }

    getEntityIDsForOwner(ownerId) {
        var entityIDs = []
        this.entities.forEach((entity)=>{
            if (entity.owner == ownerId) {
                entityIDs.push(entity.uuid)
            }
        })
        return entityIDs
    }

    getEntitiesForOwner(ownerId) {
        var owned = []
        this.entities.forEach((entity)=>{
            if (entity.owner == ownerId) {
                owned.push(entity)
            }
        })
        return owned
    }
}

export default GameSim
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

            if (isArray(doc)) {
                doc = doc[0]
            }

            if (!err) {
                console.log("loaded existing gameDB instance")
                this.gameDB = doc

                console.log("test entity name: " + this.gameDB.testEntity.name)
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
        entitySchemas.forEach((entitySchema)=>{
            console.log("load entity")
            var entity = new EntityModel()
            entity.initWithSchema(entitySchema)
            this.entities.push(entity)
        })

        //todo: when complete, start update loop
    }

    flushToDB() {
        console.log("flushToDB")
        var entitySchemas = []
        this.entities.forEach((entity)=>{
            console.log("get schema for object")
            var schemaObject = {}
            entity.writeToSchema(schemaObject)
            entitySchemas.push(schemaObject)
        })

        
        var name = this.gameDB.testEntity.name +">"
        this.gameDB.testEntity = entitySchemas[0]
        this.gameDB.testEntity.name = name

        /*
        this.gameDB.entities = entitySchemas
        */
       Game.update({_id:this.gameDB._id}, {$set: {entities: entitySchemas }}, (err, numreplaced, upserted)=>{
           console.log( "update entities with #replaced:" +numreplaced+ " & err? " + err)
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
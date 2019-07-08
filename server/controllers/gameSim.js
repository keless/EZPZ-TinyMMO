//const Game = require('../models/linvoGame')
//const EntityModel = require('../../shared/model/EntityModel')
import Game from '../models/linvoGame.js'
import {Service} from '../serverEZPZ.js'
import {EntityModel} from '../../static/shared/model/EntityModel.js'

class GameSim {
    constructor() {

        this.entities = []

        this.startupFromDB()

        Service.Add("gameSim", this)
    }

    startupFromDB() {


        //todo: when complete, start update loop
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
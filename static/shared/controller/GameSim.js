
import {Service} from '../EZPZ/Service.js'
import {EntityModel, EntitySchema} from '../model/EntityModel.js'


//xxx TODO: make this shared across client+server
class GameSim {
    constructor() {
        console.log("xxx new gamesim created")

        // signals server side to write to database
        this.dirty = false

        this.gameTime = 0
        this.entities = []
        
        Service.Add("gameSim", this)
    }

    static get instance() {
        return Service.Get("gameSim")
    }

    setDirty() {
        this.dirty = true
    }

    update() {
        //TODO: update loop
        // perform physics

        // perform AI
    }

    /// @return entityID if succesful, or null otherwise
    createCharacterForUser(userId, name, race, charClass) {
        var entity = new EntityModel()

        //xxx todo: validate params
        entity.initNewCharacter(userId, name, race, charClass)
        this.entities.push(entity)

        this.setDirty()

        return entity.uuid
    }

    updateEntityFromJson(entityJson) {
        //1) see if entity already exists, if so update it
        //2) else create new from json
        var entity = this.getEntityForId(entityJson.uuid)
        if (entity) {
            entity.updateFromJson(entityJson)
        } else {
            
            entity = new EntityModel()
            entity.fromWorldUpdateJson(entityJson)
            this.entities.push(entity)
            console.log("GameSim; update with new entity " + entity.owner +":"+ entity.uuid )
        }

        this.setDirty()
    }

    removeEntitiesById(entityIDs) {
        //xxx todo: optimize this
        var removed = false
        for (var i=this.entities.length-1; i>=0; i--) {
            if (entityIDs.includes(this.entities[i].uuid)) {
                this.entities.splice(i, 1)
                removed = true
            }
        }
        
        if (removed) {
            console.log("set dirty after removing entity")
            this.setDirty()
        }
    }

    // Accessor methods

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
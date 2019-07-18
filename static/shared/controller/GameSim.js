
import {Service} from '../EZPZ/Service.js'
import { arrayContains } from '../EZPZ/Utility.js'
import {EntityModel, EntitySchema} from '../model/EntityModel.js'
import { ICastPhysics } from '../EZPZ/castengine/CastWorldModel.js'
import { Vec2D, Rect2D } from '../EZPZ/Vec2D.js'


//xxx TODO: make this shared across client+server
class GameSim extends ICastPhysics {
    constructor() {
        super() 
        console.log("new GameSim created")

        // signals server side to write to database
        this.dirty = false

        this.gameTime = 0
        this.entities = []
        this.pWallRects = [];
        
        Service.Add("gameSim", this)
    }

    static get instance() {
        return Service.Get("gameSim")
    }

    setDirty() {
        this.dirty = true
    }

    ReadTiledMapPhysics( tiledMap ) {
        this.pWallRects = tiledMap.wallRects;
    }

    updateStep(ct, dt) {
        this.gameTime = ct

        //step each physics entity forward
        for(var eIdx = 0; eIdx < this.entities.length; eIdx++) {
            var entity = this.entities[eIdx];

            var stepVel = entity.vel.getScalarMult(dt);

            //check collision before moving forward (assuming current position is not colliding)
            var projected = entity.getArea();
            projected.addVecOffset(stepVel);

            var collisionFound = false;
            var wall = new Rect2D();
            for(var objIdx=0; objIdx<this.pWallRects.length; objIdx++) {
                var wallObj = this.pWallRects[objIdx];
                wall.setTL(wallObj.x, wallObj.y);
                wall.setSize( wallObj.width, wallObj.height);

                if(wall.isRectOverlapped(projected)) {
                //collision detected
                collisionFound = true;
                break;
                }
            }

            //move forward by velocity 
            if (!collisionFound) {
                entity.pos.addVec(stepVel);
            }
        }
        // perform AI
    }

    /// @return entityID if succesful, or null otherwise
    createCharacterForUser(userId, name, race, charClass) {
        var entity = new EntityModel()

        //xxx todo: validate params
        entity.initNewCharacter(userId, name, race, charClass)
        this._addEntity(entity)

        this.setDirty()

        return entity.uuid
    }

    getWorldUpdate() {
        var updateJson = {}
        updateJson.gameTime = this.gameTime
        
        var entities = []
        this.entities.forEach((entity)=>{
            var entitySchema = {}
            entities.push( entity.writeToSchema(entitySchema) )
        })
        updateJson.entities = entities

        return updateJson
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
            this._addEntity(entity)
            console.log("GameSim: update with new entity " + entity.owner +":"+ entity.uuid )
        }

        this.setDirty()
    }

    _addEntity(entityModel) {
        //debug: ensure entity is unique in entities
        if (arrayContains(this.entities, entityModel)) {
            console.error("GameSim: tried to insert entity that is already listed")
            return;
        }

        this.entities.push(entityModel)
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

    // ICastPhysics implementation

    // in: ICastEntity fromEntity, ICastEntity toEntity
    // out: null or Vec2D distVec
    GetVecBetween(fromEntity, toEntity) {
        return toEntity.pos.getVecSub(fromEntity.pos);
    }

    // in: ICastEntity entity
    // out: null or Vec2D pos
    GetEntityPosition(entity) {
        return toEntity.pos.clone();
    }

    // in: Vec2D p, float r, array[ICastEntity] ignoreEntities
    // out: array<ICastEntity> entities
    GetEntitiesInRadius(p, r, ignoreEntities) {
        //xxx TODO
        return null;
    }
}

export default GameSim
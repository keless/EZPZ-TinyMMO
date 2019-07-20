
import {Service} from '../EZPZ/Service.js'
import { arrayContains } from '../EZPZ/Utility.js'
import {EntityModel, EntitySchema} from '../model/EntityModel.js'
import { ICastPhysics } from '../EZPZ/castengine/CastWorldModel.js'
import { Vec2D, Rect2D } from '../EZPZ/Vec2D.js'
import TiledMap from '../EZPZ/TiledMap.js';


//xxx TODO: make this shared across client+server
class GameSim extends ICastPhysics {
    constructor() {
        super() 
        console.log("new GameSim created")

        this.verbose = true

        // signals server side to write to database
        this.dirty = false

        this.gameTime = 0
        this.entities = []
        this.pWallRects = [];

        //xxx todo: move tiled map here and separate graphics/data, and figure out how to load resources on server similar to client
        this.map = new TiledMap("gfx/levels/", 500, 500)
        this.map.playerLayerName = "Terrain2"
		//this.map.LoadFromJson(levelJson)
		
        
        Service.Add("gameSim", this)
    }

    static get instance() {
        return Service.Get("gameSim")
    }

    _log(text) {
        if(this.verbose) {
            console.log(text)
        }
    }

    setDirty() {
        this.dirty = true
    }

    LoadMapFromJson(json, withoutGraphics) {
        this.map.LoadFromJson(json, withoutGraphics)
        this.pWallRects = this.map.wallRects;
    }

    handlePlayerImpulse(playerID, data) {
        if (!data.charID) {
            this._log("error: cant apply impulse without charID")
            return 
        }
        if(!data.hasOwnProperty("speed")) {
            data.speed = 200 //xxx get default from char?
        }
        if(!data.hasOwnProperty("vecDir")) {
            data.vecDir = {x:0, y:0}
        } else {
            if (!data.vecDir.hasOwnProperty("x")) {
                data.vecDir.x = 0
            }
            if (!data.vecDir.hasOwnProperty("y")) {
                data.vecDir.y = 0
            }
        }

        //xxx TODO: handle time offset
        var character = this.getEntityForId(data.charID)
        if (character.owner != playerID) {
            this._log("error: cant apply impulse to character from non-owner")
            return
        }

        var dir = new Vec2D(data.vecDir.x, data.vecDir.y)
        var speed = data.speed
        if (data.hasOwnProperty("facing")) {
            character.facing = data.facing
        }

        //xxx todo: check if character can accept (if dead dont move, etc)
        character.vel = dir.getUnitized().scalarMult(speed)
    }

    updateStep(ct, dt) {
        this.gameTime = ct

        //step each physics entity forward
        for(var eIdx = 0; eIdx < this.entities.length; eIdx++) {
            var entity = this.entities[eIdx];

            var stepVel = entity.vel.getScalarMult(dt);

            //check collision before moving forward (assuming current position is not colliding)
            if (stepVel.nonZero() || true) {
                
                //this._log(`moving entity ${entity.name} with dt ${dt} step ${stepVel.x},${stepVel.y}`)
                

                var projected = entity.getArea();
                projected.addVecOffset(stepVel);

                //wall at:  pos 480,416  size  32x64  ctr 464,384
                //player stopped at TL 426,370
                // expected TL 473, 403
                //466 - 426 = 40
                //403 - 370 = 33 
    
                var collisionFound = false;
                var wall = new Rect2D();
                for(var objIdx=0; objIdx<this.pWallRects.length; objIdx++) {
                    var wallObj = this.pWallRects[objIdx];
                    //wall.setTL(wallObj.x, wallObj.y);
                    wall.setSize( wallObj.width, wallObj.height);
                    wall.setCenter(wallObj.x, wallObj.y)
    
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
        }
        // perform AI
    }

    /// @return entityID if succesful, or null otherwise
    createCharacterForUser(userId, name, race, charClass) {
        var entity = new EntityModel()

        //xxx todo: validate params
        entity.initNewCharacter(userId, name, race, charClass)

        //xxx todo: choose initial position from spawn points
        //this.tiledMap
        //GetRandomSpawn()

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
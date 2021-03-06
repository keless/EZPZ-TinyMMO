
import {Service} from '../EZPZ/Service.js'
import { arrayContains, SlidingWindowBuffer } from '../EZPZ/Utility.js'
import {EntityModel, EntitySchema} from '../model/EntityModel.js'
import { ICastPhysics, CastWorldModel } from '../EZPZ/castengine/CastWorldModel.js'
import { CastCommandModel, CastCommandTime, CastCommandState } from '../EZPZ/castengine/CastCommand.js'
import { Vec2D, Rect2D } from '../EZPZ/Vec2D.js'
import TiledMap from '../EZPZ/TiledMap.js'
import EventBus from '../EZPZ/EventBus.js'
import {g_abilityCatalog} from '../data/abilities.js'

//xxx TODO: make this shared across client+server
class GameSim extends CastWorldModel {
    constructor( isServer = false ) {
        super() 
        console.log("new GameSim created")

        if (CastWorldModel.instance) {
            console.warn("overwritting existing CastWorldModel instance (this shouldnt happen)")
        }

        CastWorldModel.instance = this

        this.verbose = true
        this.isServer = isServer

        // We're both the CastWorldModel and the ICastPhysics
        this.castPhysics = new GameSimCastPhysics()
        this.setPhysicsInterface(this.castPhysics)

        // signals server side to write to database
        this.dirty = false

        this.pWallRects = [];

        
        this.map = new TiledMap("gfx/levels/", 500, 500)
        this.map.playerLayerName = "Terrain2"
		//this.map.LoadFromJson(levelJson)
        
        //tracks how often updates happen in real time (NOTE: not game time)
        this.updateTimes = new SlidingWindowBuffer(60)


        // moved this into CastCommandWorld
        // SERVER ONLY --actually lets try client and server
        //if (this.isServer) {
        //    this.m_allCastCommandModels = new Map() // < abilityName:rank, CastCommandModel >
        //    this.m_allCastCommandStates = new Map() // < CastCommandState.getID(), CastCommandState >
        //}


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

    LoadMapFromJson(json) {
        var withoutGraphics = this.isServer
        this.map.LoadFromJson(json, withoutGraphics)
        this.pWallRects = this.map.wallRects;
    }

    updateStep(ct, dt) {
        this.updateTimes.push(Date.now())

        //step each physics entity forward
        this.m_allEntities.forEach((entity)=>{
            var stepVel = entity.vel.getScalarMult(dt);

            //check collision before moving forward (assuming current position is not colliding)
            if (stepVel.nonZero()) {
                
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

                    // we modified the entity, so let listeners know
                    entity.dispatch("update")
                }
            }

            entity.Update(ct, dt)
        })
        // perform AI

        super.updateStep(dt)

        EventBus.game.dispatch("gameSimUpdate", true)
    }

    getGameUpdatesPerSecond() {
        if (this.updateTimes.length < 2) {
            return 0
        }

        var start = this.updateTimes[0]
        var end = this.updateTimes.getLast()
        var period = end - start
        var samples = this.updateTimes.length
        var updatesPerMS = samples / period
        return updatesPerMS * 1000
    }

    // CALL ON SERVER ONLY
	CreateCastCommandStateForEntity( abilityName, abilityRank, entityModel ) {
		var key = abilityName + ":" + abilityRank
		if (!this.m_allCastCommandModels.has(key)) {
			var castCommandJson = g_abilityCatalog[abilityName].ranks[abilityRank - 1];
			castCommandJson.abilityId = abilityName;

			if (!castCommandJson) {
				console.warn("cant find castCommandJson for " + key)
				return //guard
			}

			this.m_allCastCommandModels.set(key, new CastCommandModel(castCommandJson, key))
		}

		var castCommandModel = this.m_allCastCommandModels.get(key)
        var castCommandState = new CastCommandState(castCommandModel, entityModel);

        //xxx WIP - better key?
        this.m_allCastCommandStates.set( entityModel.getID() + ":" + key , castCommandState )  
         
        entityModel.addAbility(castCommandState)

        return castCommandState
	}

    /// @return entityID if succesful, or null otherwise
    // CALL ON SERVER ONLY
    createCharacterForUser(userId, name, race, charClass) {
        if (!this.isServer) {
            this._log("WARN: called createCharacterForUser on client -- this is server only")
            return //guard
        }

        var entity = new EntityModel()

        //xxx todo: validate params
        entity.initNewCharacter(userId, name, race, charClass)

  

        //choose initial position from spawn points
        var spawnBlob = this.map.GetRandomSpawn() 
        entity.pos.setVal(spawnBlob.x, spawnBlob.y)


        this.AddEntity(entity)

        //xxx  test: add cast command
        this.CreateCastCommandStateForEntity("attack1", 1, entity)

        this.setDirty()

        return entity.uuid
    }

    // Serialize the world 
    // CALL ON SERVER ONLY
    getWorldUpdate() {
        if (!this.isServer) {
            this._log("WARN: called getWorldUpdate on client -- this is server only")
            return //guard
        }

        var updateJson = {}
        updateJson.gameTime = CastCommandTime.Get()
        
        var entities = []
        this.m_allEntities.forEach((entity)=>{
            entities.push( entity.toJson() )
        })
        updateJson.entities = entities

        return updateJson
    }

    updateEntityFromJson(entityJson) {
        //1) see if entity already exists, if so update it
        //2) else create new from json
        var entity = this.getEntityForId(entityJson.uuid)
        if (entity) {
            entity.LoadFromJson(entityJson)
        } else {
            entity = new EntityModel()
            entity.LoadFromJson(entityJson)
            this.AddEntity(entity)
            console.log("GameSim: update with new entity " + entity.owner +":"+ entity.uuid )
        }

        this.setDirty()
    }

    //override CastWorldModel.RemoveEntitiesById so we can mark dirty
    RemoveEntitiesById(entityIds) {
        var removed = false

        entityIds.forEach((entityId)=>{
            if(this.m_allEntities.delete(entityId)) {
                removed = true
            }
        })
        
        if (removed) {
            console.log("set dirty after removing entity")
            this.setDirty()
        }
    }

    // Accessor methods

    // getEntityForId(entityId) // in CastWorldModel

    getEntityForName(name) {
        return Array.from(this.m_allEntities.values()).find((entity)=>{
            return entity.name == name
        })
    }

    getEntityIDsForOwner(ownerId) {
        var entityIDs = []
        this.m_allEntities.forEach((entity)=>{
            if (entity.owner == ownerId) {
                entityIDs.push(entity.uuid)
            }
        })
        return entityIDs
    }

    getEntitiesForOwner(ownerId) {
        var owned = []
        this.m_allEntities.forEach((entity)=>{
            if (entity.owner == ownerId) {
                owned.push(entity)
            }
        })
        return owned
    }

    // ICastPhysics redirect
    GetVecBetween(fromEntity, toEntity) {
        return this.castPhysics.GetVecBetween(fromEntity, toEntity)
    }
    GetEntityPosition(entity) {
        return this.castPhysics.GetEntityPosition(entity)
    }
    GetEntitiesInRadius(p, r, ignoreEntities) {
        return this.castPhysics.GetEntitiesInRadius(p, r, ignoreEntities)
    }
}

class GameSimCastPhysics extends ICastPhysics  {
    // ICastPhysics implementation

    // in: ICastEntity fromEntity, ICastEntity toEntity
    // out: null or Vec2D distVec
    GetVecBetween(fromEntity, toEntity) {
        return toEntity.pos.getVecSub(fromEntity.pos);
    }

    // in: ICastEntity entity
    // out: null or Vec2D pos
    GetEntityPosition(entity) {
        return entity.pos.clone();
    }

    // in: Vec2D p, float r, array[ICastEntity] ignoreEntities
    // out: array<ICastEntity> entities
    GetEntitiesInRadius(p, r, ignoreEntities) {
        var gameSim = GameSim.instance

        //xxx todo: actually test this code
        var rSq = r * r

        var results = []
        gameSim.m_allEntities.forEach((entity, idx, arr)=>{
            if (!ignoreEntities.includes(entity)) {
                var dSq = entity.pos.getDistSqFromVec(p)
            
                if (dSq < rSq) {
                    results.push(entity);
                }
            }
        })

        return results;
    }
}

export default GameSim
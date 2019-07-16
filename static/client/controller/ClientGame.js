import PlayerModel from '../../shared/model/PlayerModel.js'
import {uuidv4} from '../clientEZPZ.js'
import EntityModel from '../../shared/model/EntityModel.js';


class ClientGameSim {
  constructor() {
    this.entities = []
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
      console.log("ClientGameSim; update with new entity " + entity.owner +":"+ entity.uuid )
    }
  }

  removeEntitiesById(entityIDs) {
    //xxx todo: optimize this
    for (var i=this.entities.length-1; i>=0; i--) {
      if (entityIDs.includes(this.entities[i].uuid)) {
        this.entities.splice(i, 1)
      }
    }
  }

  getEntityForId(entityId) {
    return this.entities.find((entity)=> {
        return entity.uuid == entityId
    })
  }

  getEntityIDsForOwner(ownerId) {
      var entityIDs = []
      console.log("get entities for owner " + ownerId)
      this.entities.forEach((entity)=>{
          console.log("compare owner " + entity.owner + " with " + ownerId) 
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

class ClientGame {
  static s_instance = new ClientGame()
  static Get() { 
    return ClientGame.s_instance
  }

  constructor() {
    this.uuid = uuidv4()
    this.currentUserID = null

    this.gameSim = new ClientGameSim()
  }

  setUserID( userID ) {
    console.log("current user set to " + userID)
    this.currentUserID = userID
  }

  removeEntitiesById(entityIDs) {
    this.gameSim.removeEntitiesById(entityIDs)
  }

  getEntitiesForCurrentPlayer() {
    return this.gameSim.getEntitiesForOwner(this.currentUserID)
  }

  applyWorldUpdate( worldUpdateJson ) {
    console.log("todo: apply world update")
    if (worldUpdateJson.entities) {
      console.log("todo: update with entities")
      console.log(worldUpdateJson.entities)

      worldUpdateJson.entities.forEach((entityJson)=>{
        this.gameSim.updateEntityFromJson(entityJson)
      })
    }
  }
}

export default ClientGame
export { ClientGame }
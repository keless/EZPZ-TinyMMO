import PlayerModel from '../../shared/model/PlayerModel.js'
import {uuidv4} from '../clientEZPZ.js'

class ClientGame {
  static s_instance = new ClientGame()
  static Get() { 
    return ClientGame.s_instance
  }

  constructor() {
    this.uuid = uuidv4()
    this.currentUserID = null
    this.players = []
  }

  setUserID( userID ) {
    console.log("current user set to " + userID)
    this.currentUserID = userID
  }
}

class ClientGameSim {
  constructor() {
    this.entities = []
  }

  applyWorldUpdate( worldUpdateJson ) {
    console.log("todo: apply world update")
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

export default ClientGame
export { ClientGame }
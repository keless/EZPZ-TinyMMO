import PlayerModel from '../../shared/model/PlayerModel.js'
import {uuidv4} from '../clientEZPZ.js'
import EntityModel from '../../shared/model/EntityModel.js';
import GameSim from '../../shared/controller/GameSim.js'

class ClientGame {
  static s_instance = new ClientGame()
  static Get() { 
    return ClientGame.s_instance
  }

  static get instance() {
    return ClientGame.s_instance
  }

  constructor() {
    this.uuid = uuidv4()
    this.currentUserID = null

    this.gameSim = new GameSim()
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
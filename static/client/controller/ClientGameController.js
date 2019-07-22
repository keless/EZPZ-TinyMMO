import PlayerModel from '../../shared/model/PlayerModel.js'
import {uuidv4} from '../clientEZPZ.js'
import EntityModel from '../../shared/model/EntityModel.js';
import GameSim from '../../shared/controller/GameSim.js'
import { CastCommandTime } from '../../shared/EZPZ/castengine/CastWorldModel.js';


class ClientGameController {
  static get instance() {
    return ClientGameController.s_instance
  }

  constructor() {
    this.uuid = uuidv4()
    this.currentUserID = null

    this.latestKnownWorldUpdateIdx = 0

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

  updateOwnedEntities( updateJson ) {
    if (updateJson.entities) {
      updateJson.entities.forEach((entityJson)=>{
        this.gameSim.updateEntityFromJson(entityJson)
      })
    }
  }

  applyWorldUpdate( worldUpdateJson ) {
    if (!worldUpdateJson.hasOwnProperty("worldUpdateIdx")) {
      console.log("WARN: worldUpdate did not include index, ignoring")
      return //guard
    } else if (worldUpdateJson.worldUpdateIdx == this.latestKnownWorldUpdateIdx) {
      console.log("WARN: we've already applied this update, ignoring")
      return //guard
    }

    var currentGameTime = CastCommandTime.Get()
    if (worldUpdateJson.gameTime < currentGameTime) {      
      this._retroactivelyApplyServerWorldUpdate(worldUpdateJson)
    } else {
      this._catchUpToServerWorldUpdate(worldUpdateJson)
    }
      
    this.latestKnownWorldUpdateIdx = worldUpdateJson.worldUpdateIdx
  }

  _catchUpToServerWorldUpdate(worldUpdateJson) {
    CastCommandTime.Set(worldUpdateJson.gameTime)

    if (worldUpdateJson.entities) {
      //console.log(worldUpdateJson.entities)

      worldUpdateJson.entities.forEach((entityJson) => {
        this.gameSim.updateEntityFromJson(entityJson)
      })
    }
  }

  _retroactivelyApplyServerWorldUpdate(worldUpdateJson) {
    var currentGameTime = CastCommandTime.Get()
    var delta = currentGameTime - worldUpdateJson.gameTime
    console.log(`WARN: world update is behind ${delta.toFixed(4)}`)

    if (worldUpdateJson.entities) {
      //fast forward velocity->position

      worldUpdateJson.entities.forEach((entityJson) => {
        //this.gameSim.updateEntityFromJson(entityJson)
        this.gameSim.updateEntityFromJsonWithFFD(entityJson, delta)
      })
    }
  }

}

//xxx todo: move to Service and initialize clientGame explicitly somewhere
ClientGameController.s_instance = new ClientGameController()

export default ClientGameController
export { ClientGameController }
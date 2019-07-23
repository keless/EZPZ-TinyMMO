import PlayerModel from '../../shared/model/PlayerModel.js'
import {uuidv4} from '../clientEZPZ.js'
import EntityModel from '../../shared/model/EntityModel.js';
import GameSim from '../../shared/controller/GameSim.js'
import CastWorldModel, { CastCommandTime } from '../../shared/EZPZ/castengine/CastWorldModel.js';


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

  // How to apply a worldUpdate with a timestamp behind the current gameTime
  // 1) store delta of  gameTime - worldUpdate.gameTime
  // 2) set clock backwards to worldUpdate.gameTime
  // 3) apply like a normal world update
  // 4) run an extra updateStep(ct, dt) where dt = delta from (1)
  _retroactivelyApplyServerWorldUpdate(worldUpdateJson) {
    //console.log(`WARN: world update is behind ${delta.toFixed(4)}`)

    // 1) store delta of  gameTime - worldUpdate.gameTime
    var ct = CastCommandTime.Get()
    var dt = currentGameTime - worldUpdateJson.gameTime

    // 2 & 3) set clock backwards to worldUpdate.gameTime, and apply like a normal world update
    this._catchUpToServerWorldUpdate(worldUpdateJson)

    // 4) run an extra updateStep(ct, dt) where dt = delta from (1)
    var gameSim = GameSim.instance
    gameSim.updateStep(ct, dt)
  }

}

//xxx todo: move to Service and initialize clientGame explicitly somewhere
ClientGameController.s_instance = new ClientGameController()

export default ClientGameController
export { ClientGameController }
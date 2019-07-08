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

export default ClientGame
export { ClientGame }
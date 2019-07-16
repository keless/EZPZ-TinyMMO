import { Service, EventBus } from '../clientEZPZ.js'
import ClientGame from '../controller/ClientGame.js';

export default class ClientProtocol {
    constructor() { 
        this.verbose = true
        this.socket = null
        
        Service.Add("protocol", this);
    }
    
    _log(txt) {
        if (this.verbose) {
            console.log(txt)
        }
    }

    beginConnection() {
        this.closeConnection()

        this._log("Protocol: beginning socket connection")
        this.socket = io()

        var self = this
        this.socket.on("connected", (data)=>{
            self._log("connected to server")

            if (data) {
                var clientGame = ClientGame.Get()
                if (data.userId) {
                    clientGame.setUserID(data.userId)
                }
                if (data.worldUpdate) {
                    var worldUpdate = data.worldUpdate
                    clientGame.applyWorldUpdate(worldUpdate)
                }
            }

            EventBus.game.dispatch("serverConnect")
        })

        //xxx WIP - add error handler
    }

    closeConnection() {
        if(this.socket) {
            this._log("Protocol: closing socket connection")

            this.socket.close()
            this.socket = null
        }
    }

    send(category, data, cbFunc, binary = false) {
        if(this.socket) {
            this.socket.binary(binary).emit(category, data, cbFunc)
        } else {
            console.warn("Protocol: tried to send without a socket")
        }
    }

    // Ask the server to create a character (with us as the owner)
    // ackCB should contain a WorldUpdateModel with only the new character in it
    requestCreateCharacter( name, race, charClass, ackCB ) {
        this._log("request create character")
        this.send("createCharacter", { name:name, race:race, charClass:charClass }, ackCB)
    }

    // Ask the server to delete a character (we must be the owner)
    // ackCB should contain { entitiesRemoved:[uuid] } with the uuid of the character removed
    requestDeleteCharacter(uuid, ackCB) {
        this._log("request delete character")
        this.send("deleteCharacter", { uuid:uuid }, ackCB)
    }
}
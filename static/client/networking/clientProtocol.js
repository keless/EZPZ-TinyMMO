import { Service, EventBus } from '../clientEZPZ.js'
import ClientGame from '../controller/ClientGame.js';

export default class ClientProtocol {
    constructor() { 
        this.verbose = true
        this.socket = null
        
        Service.Add("protocol", this);
    }
    
    static get instance() {
        return Service.Get("protocol")
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

        this.socket.on("disconnect", (reason)=>{
            this._log("disconnect recieved with reason: " + reason)
            setTimeout(() => { window.location.reload(true) }, 2000)
        })
        this.socket.on("error", (err)=>{
            this._log("error recieved")
            if (err) { console.log(err) }
            setTimeout(() => { window.location.reload(true) }, 2000)
        })

        this.socket.on("worldUpdate", (data)=> {
            this._log("TODO: handle world update")
        })
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

    // Update server with player direction+speed input change (ie: joystick status)
    // ackCB should contain no error
    sendInputImpulseChange( vecDir, speed ) {
        this._log("send impulse change ") // + vecDir.x + "," + vecDir.y )
        this.send("playerImpulse", { vecDir:vecDir.toJson(), speed:speed }, (data)=>{
            if (data.error) {
                this._log("error " + data.error)
            }
        } )
    }
}

export { ClientProtocol }
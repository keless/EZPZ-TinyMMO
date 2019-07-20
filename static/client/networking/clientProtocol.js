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
                var clientGame = ClientGame.instance
                if (data.userId) {
                    clientGame.setUserID(data.userId)
                }
                if (data.ownedEntities) {
                    //var worldUpdate = data.worldUpdate
                    //clientGame.applyWorldUpdate(worldUpdate)
                    clientGame.updateOwnedEntities(data.ownedEntities)
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
            //this._log("TODO: handle world update")

            //xxx WIP - handle delta
            ClientGame.instance.applyWorldUpdate(data.fullWorldUpdate)
            
        })

        this.socket.on("fullWorldUpdate", (data)=> {
            ClientGame.instance.applyWorldUpdate(data)
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
    // charID should be the EntityModel.uuid of the character being controlled
    // vecDir should be the direction of movement (will be unitized on server before multiplied by speed)
    // gameTime should be the gameTime the player input happened (so it can be applied retroactively on server) 
    // ackCB should contain no error
    sendInputImpulseChange( charID, vecDir, speed, facing, gameTime ) {
        //this._log("send impulse change ") // + vecDir.x + "," + vecDir.y )
        console.log("send facing " + facing)
        this.send("playerImpulse", { charID:charID, vecDir:vecDir.toJson(), speed:speed, facing:facing, gameTime:gameTime }, (data)=>{
            if (data.error) {
                this._log("error " + data.error)
            }
        } )
    }
}

export { ClientProtocol }
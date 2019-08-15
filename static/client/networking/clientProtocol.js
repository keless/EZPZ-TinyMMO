import { Service, EventBus, SlidingWindowBuffer } from '../clientEZPZ.js'
import ClientGameController from '../controller/ClientGameController.js'

export default class ClientProtocol {
    constructor() { 
        this.verbose = true
        this.extraVerbose = false
        this.socket = null

        this.dbgIgnoreServerWorldUpdates = false

        this.avgLagMS = 0

        this.worldUpdateBuffer = new SlidingWindowBuffer(10)
        
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
    _logVerbose(txt) {
        if (this.extraVerbose) {
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
                var clientGame = ClientGameController.instance
                if (data.userId) {
                    clientGame.setUserID(data.userId)
                }
                if (data.ownedEntities) {
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
            //this._log("handle world update")

            if (data.hasOwnProperty("deltaWorldUpdate")) {
                // attempt to apply patch and use it
                var delta = data.deltaWorldUpdate
                var deltaIdx = data.deltaWorldUpdateIdx
                var prevUpdate = this._getWorldUpdateForIdx(deltaIdx - 1)
                if (!prevUpdate) {
                    this._log(`got a delta idx(${deltaIdx}) but missing previous worldUpdate, request full update`)
                    //request full update
                    this.requestFullWorldUpdate()
                    return //guard
                }

                //xxx todo: only store encoded world updates so we dont have to keep doing this?
                var encoder = new TextEncoder()
                var strUpdate = JSON.stringify(prevUpdate)
                var encoded = encoder.encode(strUpdate)

                // xxx TODO: try catch 
                var fullEncoded = fossilDelta.apply(encoded, delta)

                var decoder = new TextDecoder()
                var strFullUpdate = decoder.decode(new Uint8Array(fullEncoded))
                var fullWorldUpdateJson = JSON.parse(strFullUpdate)

                if (fullWorldUpdateJson.worldUpdateIdx != deltaIdx) {
                    this._log("WARN: what trickery is this? world update idx does not match delta idx")
                    //request full update
                    this.requestFullWorldUpdate()
                    return //guard
                } else {
                    this._logVerbose("got deltaWorldUpdate, succesfully applied patch and extracted full world update!")
                    this._acceptFullWorldUpdate(fullWorldUpdateJson)
                }

            } else if (data.hasOwnProperty("fullWorldUpdate")) {
                // The first update a server sends cant be a delta, so it'll be sent as fullWorldUpdate instead
                ClientGameController.instance.applyWorldUpdate(data.fullWorldUpdate)
            }
        })

        this.socket.on("fullWorldUpdate", (data)=> {
            var updateIdx = data.worldUpdateIdx
            var latestIdx = this._getLatestWorldUpdateIdx()
            if (updateIdx <= latestIdx) {
                console.log("WARN: got outdated fullWorldUpdate, ignoring")
                return //guard
            }

            this._acceptFullWorldUpdate(data)
        })
    }

    _acceptFullWorldUpdate(fullWorldUpdateJson) {
        if (this.dbgIgnoreServerWorldUpdates) {
            return
        }

        this.worldUpdateBuffer.push(fullWorldUpdateJson)
        ClientGameController.instance.applyWorldUpdate(fullWorldUpdateJson)
    }

    // returns null if not found in buffer
    _getWorldUpdateForIdx(idx) {
        return this.worldUpdateBuffer.find((update)=>{
            return update.worldUpdateIdx == idx
        })
    }

    // return -1 if no updates received ever
    _getLatestWorldUpdateIdx() {
        var latestWorldUpdate = this.worldUpdateBuffer.getLatest()
        if (latestWorldUpdate) {
            return latestWorldUpdate.worldUpdateIdx
        } else {
            return -1
        }
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
        this.send("playerImpulse", { charID:charID, vecDir:vecDir.toJson(), speed:speed, facing:facing, gameTime:gameTime }, (data)=>{
            if (data.error) {
                this._log("error " + data.error)
            } else if (data.inputDT) {
                this.avgLagMS = (this.avgLagMS + data.inputDT) / 2
            }
        })
    }

    // Tell server player is using an ability
    // charID should be the EntityModel.uuid of the character being controlled
    // ability is the CastCommandState.getModelID() of the ability
    // gameTime should be the gameTime the player input happened (so it can be applied retroactively on server) 
    sendAbility( charID, abilityModelID, gameTime ) {
        this.send("playerAbility", { charID:charID, abilityModelID:abilityModelID, gameTime:gameTime }, (data)=>{
            if (data.error) {
                //xxx todo: check if ability could not be cast because of non-fatal reason (lack of mana, stunned, etc)
                this._log("error " + data.error)
            } else if (data.inputDT) {
                this.avgLagMS = (this.avgLagMS + data.inputDT) / 2
            }
        })
    }

    // Ask server to send us a fullWorldUpdate for the latest, so we'll completely reset our state and catch up
    // Only call this if we're starting a new session and have no world updates, or we dropped an update and need to catch up
    // ackCB should contain a full world update
    requestFullWorldUpdate() {
        this.send("requestFullWorldUpdate", {}, (data)=>{
            if(data.error) {
                this._log("error " + data.error)
            } else {
                this._log("got full world update #" + data.worldUpdateIdx)
                this._acceptFullWorldUpdate(data)
            }
        })
    }

    getLagMS() {
        return this.avgLagMS
    }
}

export { ClientProtocol }
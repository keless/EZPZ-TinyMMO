import GameSim from '../../static/shared/controller/GameSim.js'
import User from '../models/linvoUser.js'
import Service from '../../static/shared/EZPZ/Service.js'
import WorldUpdateModel from '../../static/shared/model/WorldUpdateModel.js'
import ServerGameController from '../controllers/ServerGameController.js'


class SocketClient {
    constructor(socket, clientID) {
        this.socket = socket
        this.clientID = clientID

        this.verbose = true
        this._veryVerbose = false
        
        this._addUserMessageHandler('createCharacter', this.onCreateCharacter)
        this._addUserMessageHandler('deleteCharacter', this.onDeleteCharacter)
        this._addUserMessageHandler('playerImpulse', this.onPlayerImpulse)
        this._addUserMessageHandler('fullWorldUpdate', this.onFullWorldUpdate)
    }

    emit(message, data) {
        this.socket.emit(message, data)
    }

    _log(text) {
        if(this.verbose) {
            console.log(text)
        }
    }
    _logVerbose(text) {
        if(this._veryVerbose) {
            console.log(text)
        }
    }

    /// Expect: { name:String, race:String, charClass:String }
    /// Response: { worldUpdate:WorldUpdate }
    onCreateCharacter(data, response) {
        //create character for user
        var userId = this.clientID

        //todo: validate input params
        var name = data.name
        var race = data.race
        var charClass = data.charClass

        if (!name || !race || !charClass) {
            response({error:"invalid inputs name " + name + " race " + race + " class " + charClass})
            return
        }
        
        this._log("on create character with name " + name + " race " + race + " class " + charClass)
        var gameSim = GameSim.instance
        var entityID = gameSim.createCharacterForUser(userId, name, race, charClass)
        if (entityID) {
            var entity = gameSim.getEntityForId(entityID)
            this._log("create character success; sending ack entityID " + entityID )
    
            response( this._getWorldUpdateForEntityIDs([entityID]) )

            ServerGameController.instance.flushToDB()
        } else {
            this._log("could not create character")
            response({error:"could not create character"})
        }
    }

    /// Expect: { uuid:String }
    /// Response: { entitiesRemoved:[uuid] }
    onDeleteCharacter(data, response) {
        var userId = this.clientID
        var charId= data.uuid

        var gameSim = GameSim.instance
        var character = gameSim.getEntityForId(charId)
        if (!character) {
            //doesnt exist
            this._log("could not delete non-existant character")
            response({error:"cant delete character: does not exist"})
        } else if (character.owner != userId ) {
            //dont own it, so cant delete it
            this._log("could not delete un-owned character")
            response({error:"cant delete character: not the owner"})
        } else {
            //delete
            this._log("deleted character " + charId)
            gameSim.removeEntitiesById([charId])
            response({entitiesRemoved:[charId]})

            ServerGameController.instance.flushToDB()
        }
    }

    /// Expect: { vecDir: Vec2D.jsonObject, speed:Number }
    /// Response: { } //empty object (for now)
    onPlayerImpulse(data, response) {

        this._logVerbose("got player impulse")
        this._logVerbose(data)
        //xxx todo: apply this to next gameSim step
        var gameSim = GameSim.instance
        gameSim.handlePlayerImpulse(this.clientID, data)

        response({})
    }

    /// Expect: { updateIdx:Number [-1 to n] }
    ///  if updateIdx is -1, the latest worldUpdate is returned
    ///  if updateIdx represents a worldUpdate that server doesnt have, latest worldUpdate is returned
    /// Response: { fullWorldUpdateJsonObject }
    onFullWorldUpdate(data, response) {

        var worldUpdateIdx = -1
        if (data.hasOwnProperty("updateIdx")) {
            worldUpdateIdx = data.updateIdx
        }
        //xxx WIP
        var gameController = ServerGameController.instance
        var fullWorldUpdate = gameController.getFullWorldUpdateByIdx(worldUpdateIdx)

        response(fullWorldUpdate)
    }

    /// @param entityIDs is an array of uuids
    _getWorldUpdateForEntityIDs( entityIDs ) {
        var gameSim = GameSim.instance
        var entities = []
        entityIDs.forEach((entityID)=>{
            var entity = gameSim.getEntityForId(entityID)
            if (entity) {
                entities.push( entity.getWorldUpdateJson() )
            }
        })

        var worldUpdate = new WorldUpdateModel()
        worldUpdate.addEntities(entities)

        return worldUpdate.getPayloadJson()
    }


    _logProtocol(message) {
        let logIgnore = [ "playerImpulse" ]
        if (!logIgnore.includes(message)) {
            this._log("Protocol: handle " + message)
        }
    }

    /// adds a socket message handler that expects to come from a valid user
    /// will find socketClient in our stored list, or create a new entry if none exists
    /// will disconnect socket if no valid Passport session
    /// @param callback  func(data, response)
    _addUserMessageHandler(message, callback) {
        this._logVerbose("add message handler for " + message)
        this.socket.on(message, (data, response) => {
            this._logProtocol(message)
            if (!this.socket.request.session.passport) {
                //connection from invalid client, throw away
                this.socket.disconnect(true)
                this._log("disconnected invalid client (no passport session)")

                response("invalid client", data)
                return
            }

            callback.bind(this)(data, response)
        })
    }
}

class ServerProtocol {
    constructor(socketio) {
        this.verbose = true
        this.io = socketio
        this.socketClients = []

        Service.Add("serverProtocol", this)
    }

    static get instance() {
        return Service.Get("serverProtocol")
    }

    getSocketClientForUserID(userId) {
        //xxx todo: use lookup hash
        this.socketClients.find((sc)=> {
            return sc.clientID == userId
        })
    }

    _log(text) {
        if (this.verbose) {
            console.log(text)
        }
    }

    beginListening() {
        this._log("Protocol: begin listening")
        this.io.on('connection', (socket)=>{
            this._log("Protocol: new socket connection")

            if (!socket.request.session.passport) {
                //connection from invalid client, throw away
                socket.disconnect(true)
                return
            }

            // determine clientID from socket session
            var userId = socket.request.session.passport.user;
            User.findOne({_id:userId}, (findErr, user)=>{
                if (user) {
                    console.log("connection from ", user.email, "uid:", userId);

                    // compare with database, then create a socketClient pair
                    var client = new SocketClient(socket, userId)
                    this.socketClients.push(client)
                    
                    //return player's characters
                    var gameSim = Service.Get("gameSim")
                    var entitiesForPlayer = gameSim.getEntitiesForOwner(userId) //xxx WIP

                    var worldUpdate = new WorldUpdateModel()
                    worldUpdate.addEntities(entitiesForPlayer)
                    

                    client.emit("connected", { userId: userId, ownedEntities: worldUpdate.getPayloadJson() })
                } else {
                    console.warn("socket connected with passport session, but no registered user " + findErr)
                }
            })
        })
    }

    broadcast(message, data) {
        this.io.sockets.emit(message, data)
    }
}

//module.exports = { SocketClient, ServerProtocol }
export default ServerProtocol
export { SocketClient, ServerProtocol }
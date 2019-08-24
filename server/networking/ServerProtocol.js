import GameSim from '../../static/shared/controller/GameSim.js'
import User from '../models/linvoUser.js'
import Service from '../../static/shared/EZPZ/Service.js'
import WorldUpdateModel from '../../static/shared/model/WorldUpdateModel.js'
import ServerGameController from '../controllers/ServerGameController.js'
import { SlidingWindowBuffer } from '../../static/shared/EZPZ/Utility.js'
import fossilDelta from 'fossil-delta'
import {performance} from 'perf_hooks'


class SocketClient {
    constructor(socket, clientID) {
        this.socket = socket
        this.clientID = clientID

        this.verbose = true
        this._veryVerbose = false
        
        this._addUserMessageHandler('createCharacter', this.onCreateCharacter)
        this._addUserMessageHandler('deleteCharacter', this.onDeleteCharacter)
        this._addUserMessageHandler('playerImpulse', this.onPlayerImpulse)
        this._addUserMessageHandler('playerAbility', this.onPlayerAbility)
        this._addUserMessageHandler('requestFullWorldUpdate', this.onRequestFullWorldUpdate)

        this.socket.on('error', (error)=>{
            console.error("Error: " + error)
        });
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
    /// Response: { entities:[ all currently owned entities, including new one ], createdCharacterId:String (id of new entity) }
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

        //ensure name is unique
        var gameSim = GameSim.instance
        var foundEntity = gameSim.getEntityForName(name)
        if (foundEntity) {
            response({error:"that name is already taken"})
            return
        }

        this._log("on create character with name " + name + " race " + race + " class " + charClass)
        
        var entityID = gameSim.createCharacterForUser(userId, name, race, charClass)
        if (entityID) {
            var entity = gameSim.getEntityForId(entityID)
            this._log("create character success; sending ack entityID " + entityID )
    
            var result = this._getWorldUpdateForEntityIDs([entityID])
            result.createdCharacterId = entityID
            response(result )

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
            gameSim.RemoveEntitiesById([charId])
            response({entitiesRemoved:[charId]})

            ServerGameController.instance.flushToDB()
        }
    }

    /// Expect: { charID:uuid, vecDir:Vec2D.toJson(), speed:Number, facing:int, gameTime:Double seconds }
    /// Response: { } //empty object (for now)
    onPlayerImpulse(data, response) {

        this._logVerbose("got player impulse")
        this._logVerbose(data)

        var gameController = ServerGameController.instance
        

        var impulseData = data
        impulseData.ownerID = this.clientID

        // validate data
        if (!impulseData.charID || !impulseData.ownerID || !impulseData.gameTime) {
            this._log("error: cant apply impulse, missing required field")
            return response({ error: "missing input fields"})
        }
        if (!impulseData.hasOwnProperty("speed")) {
            impulseData.speed = 200 //xxx todo: get default from char?
        }
        if (!impulseData.hasOwnProperty("vecDir")) {
            impulseData.vecDir = { x: 0, y: 0 }
        } else {
            if (!impulseData.vecDir.hasOwnProperty("x")) {
                impulseData.vecDir.x = 0
            }
            if (!impulseData.vecDir.hasOwnProperty("y")) {
                impulseData.vecDir.y = 0
            }
        }

        gameController.queuePlayerImpulse(impulseData, response)

        //response({})
    }

    /// Expect: { charID:uuid, abilityModelId:"name:rank", castTarget:json, gameTime:Double seconds }
    /// Response: { } //empty object (for now)
    onPlayerAbility(data, response) {

        this._logVerbose("got player ability " + data.abilityModelId)
        this._logVerbose(data)

        var gameController = ServerGameController.instance
        data.ownerID = this.clientID
        gameController.queuePlayerAbility(data, response)

        //response({})
    }

    /// Expect: { updateIdx:optional Number [-1 to n] }
    ///  if updateIdx is -1 or not present, the latest worldUpdate is returned
    ///  if updateIdx represents a worldUpdate that server doesnt have, latest worldUpdate is returned
    /// Response: { fullWorldUpdateJsonObject }
    onRequestFullWorldUpdate(data, response) {

        var worldUpdateIdx = -1
        if (data && data.hasOwnProperty("updateIdx")) {
            worldUpdateIdx = data.updateIdx
        }
 
        var serverProtocol = ServerProtocol.instance
        var fullWorldUpdate = serverProtocol.getFullWorldUpdateByIdx(worldUpdateIdx)

        response(fullWorldUpdate)
    }

    /// @param entityIDs is an array of uuids
    _getWorldUpdateForEntityIDs( entityIDs ) {
        var gameSim = GameSim.instance
        var entities = []
        entityIDs.forEach((entityID)=>{
            var entity = gameSim.getEntityForId(entityID)
            if (entity) {
                entities.push( entity.toJson() )
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

            // If caller didnt send data, create dummy object
            data = data || {}

            callback.bind(this)(data, response)
        })
    }
}

class ServerProtocol {
    constructor(socketio) {
        this.verbose = true
        this.io = socketio
        this.socketClients = []

        this.worldUpdateBuffer = new SlidingWindowBuffer(10)
        this.worldUpdateIdx = 0

        Service.Add("serverProtocol", this)
    }

    static get instance() {
        return Service.Get("serverProtocol")
    }

    getSocketClientForUserID(userId) {
        //xxx todo: use lookup hash?
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
                    var entitiesForPlayer = gameSim.getEntitiesForOwner(userId)

                    var worldUpdate = new WorldUpdateModel()
                    var entities = []
                    entitiesForPlayer.forEach((entity)=>{
                        if (entity) {
                            entities.push( entity.toJson() )
                        }
                    })
                    worldUpdate.addEntities(entities)
                    

                    client.emit("connected", { userId: userId, ownedEntities: worldUpdate.getPayloadJson() })
                } else {
                    console.warn("socket connected with passport session, but no registered user " + findErr)
                }
            })
        })
    }

    broadcast(message, data) {
        this.io.sockets.binary(false).emit(message, data)
    }
    broadcastWithBinary(message, data) {
        this.io.sockets.binary(true).emit(message, data)
    }


    // world updates

    sendWorldUpdate() {
        var gameSim = GameSim.instance
        var worldUpdateJson = gameSim.getWorldUpdate()
        worldUpdateJson.worldUpdateIdx = this.worldUpdateIdx++

        var previousWorldUpdateJson = this.worldUpdateBuffer.getLast()
        this.worldUpdateBuffer.push(worldUpdateJson)

        var delta = null
        if (previousWorldUpdateJson) {
            // record time it takes to generate deltas for later optimization
            var pf_start = performance.now()
            delta = {}
            var u1str = JSON.stringify(previousWorldUpdateJson)
            var u2str = JSON.stringify(worldUpdateJson)
            var pf_str = performance.now()
            //generate a delta
            var encoder = new TextEncoder()
            var enc1 = encoder.encode(u1str)
            var enc2 = encoder.encode(u2str)
            var pf_delta = performance.now()
            var byteArrayDelta = fossilDelta.create(enc1, enc2)
            delta = byteArrayDelta

            var pf_finish = performance.now()

            /*
            var pf_processTotal = pf_finish - pf_start
            var pf_stringifyTotal = pf_str - pf_start
            var pf_encoderTotal = pf_delta - pf_str
            var pf_fossilDeltaTotal = pf_finish - pf_delta
            console.log(`wu tot:${pf_processTotal.toFixed(4)} str:${pf_stringifyTotal.toFixed(4)} enc:${pf_encoderTotal.toFixed(4)} dt:${pf_fossilDeltaTotal.toFixed(4)} `)
            // with 1 entity (lol), avg 0.06MS  0.023ms strings, 0.011ms encoding, 0.026ms delta
            
            var size_worldUpdate = enc2.length
            var size_delta = byteArrayDelta.length
            console.log(`wu ${size_worldUpdate} compressed to ${size_delta} - ratio ${((size_delta/size_worldUpdate)*100).toFixed(2)}%`)
            // with 6 entities only 1 moving (lol), avg world update size 2020 bytes, compressed to 50 bytes, compression ratio 98%
            */
        }

        var sendObj = {}
        if (delta != null) {
            sendObj.deltaWorldUpdate  = delta
            sendObj.deltaWorldUpdateIdx = worldUpdateJson.worldUpdateIdx
        } else {
            sendObj.fullWorldUpdate = worldUpdateJson
        }

        ServerProtocol.instance.broadcastWithBinary("worldUpdate", sendObj)
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

    // if idx == -1, returns latest
    // if idx is not found in buffer, returns latest
    getFullWorldUpdateByIdx(idx) {
        var update = this.worldUpdateBuffer.getLast()

        if ((idx != -1) && (update.worldUpdateIdx != idx)) {
            var searchResult = this.worldUpdateBuffer.find((e)=>{
                return e.worldUpdateIdx == idx
            })

            if (searchResult) {
                update = searchResult
            }
        }

        return update
    }
}

//module.exports = { SocketClient, ServerProtocol }
export default ServerProtocol
export { SocketClient, ServerProtocol }
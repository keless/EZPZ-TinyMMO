//const User = require('../models/linvoUser')
//const GameWorld = require('../models/linvoGame')
//const Service = require('../../shared/EZPZ/Service')
import GameSim from '../controllers/gameSim.js'
import User from '../models/linvoUser.js'
import Service from '../../shared/EZPZ/Service.js'


class SocketClient {
    constructor(socket, clientID) {
        this.socket = socket
        this.clientID = clientID

        this.verbose = true
        
        this._addUserMessageHandler('createCharacter', this.onCreateCharacter)
    }

    emit(data) {
        this.socket.emit(data)
    }

    _log(text) {
        if(this.verbose) {
            console.log(text)
        }
    }

    // Expect: { name:String, race:String, charClass:String }
    onCreateCharacter(err, data, response) {
        //create character for user
        var userId = this.clientID

        //todo: validate input params
        var name = data.name
        var race = data.race
        var charClass = data.charClass
        
        //xxx WIP
        this._log("on create character with name " + name + " race " + race + " class " + charClass)
        var gameSim = Service.Get("gameSim")
        var entityID = gameSim.createCharacterForUser(userId, name, race, charClass)
        if (entityID) {
            var entity = gameSim.getEntityForId(entityID)
            this._log("create character success; sending ack entityID " + entityID )
            //xxx WIP
            response({ entityID: entityID, name:name }) //todo: send whole character
        } else {
            this._log("could not create character")
            response({error:"could not create character"})
        }
    }


    /// adds a socket message handler that expects to come from a valid user
    /// will find socketClient in our stored list, or create a new entry if none exists
    /// will disconnect socket if no valid Passport session
    /// @param callback  func(err, data, response)
    _addUserMessageHandler(message, callback) {
        this._log("add message handler for " + message)
        this.socket.on(message, (data, response) => {
            this._log("Protocol: handle " + message)
            if (!this.socket.request.session.passport) {
                //connection from invalid client, throw away
                this.socket.disconnect(true)

                response("invalid client", data)
                return
            }

            callback.bind(this)(null, data, response)
        })
    }
}

class ServerProtocol {
    constructor(socketio) {
        this.verbose = true
        this.io = socketio
        this.socketClients = []
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
            console.log("Your User ID is", userId);

            User.findOne({_id:userId}, (findErr, user)=>{
                if (user) {
                    console.log("Your User email is", user.email);

                    // compare with database, then create a socketClient pair
                    var client = new SocketClient(socket, userId)
                    this.socketClients.push(client)
                    
                    client.emit("connected")
                } else {
                    console.warn("socket connected with passport session, but no registered user " + findErr)
                }
            })
        })
    }
}

//module.exports = { SocketClient, ServerProtocol }
export default ServerProtocol
export { SocketClient, ServerProtocol }
const User = require('../models/linvoUser')

class SocketClient {
    constructor(socket, clientID) {
        this.socket = socket
        this.clientID = clientID
    }

    emit(data) {
        this.socket.emit(data)
    }
}

class ServerProtocol {
    constructor(socketio) {
        this.verbose = true
        this.io = socketio
        this.socketClients = []
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

            //xxx todo: how to determine client from socket
            var userId = socket.request.session.passport.user;
            console.log("Your User ID is", userId);

            User.findOne({_id:userId}, (findErr, user)=>{
                if (user) {
                    console.log("Your User email is", user.email);

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

module.exports = { SocketClient, ServerProtocol }
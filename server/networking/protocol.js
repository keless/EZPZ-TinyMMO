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
            //xxx todo: how to determine client from socket
            this._log("Protocol: new socket connection")
            var client = new SocketClient(socket, "???")
            this.socketClients.push(client)
            
            client.emit("connected")

        })
    }

}

module.exports = { SocketClient, ServerProtocol }
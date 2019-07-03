
class ClientProtocol {
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
        this.socket.on("connected", ()=>{
            self._log("connected to server")


            EventBus.game.dispatch("serverConnect")
        })
    }

    closeConnection() {
        if(this.socket) {
            this._log("Protocol: closing socket connection")

            this.socket.close()
            this.socket = null
        }
    }

    send(category, data, binary = false) {
        if(this.socket) {
            this.socket.binary(binary).emit(category, data)
        } else {
            console.warn("Protocol: tried to send without a socket")
        }
    }
}
import { Vec2D } from '../../shared/EZPZ/Vec2D.js'
import { CastCommandTime } from '../../shared/EZPZ/castengine/CastWorldModel.js'
import ClientProtocol from '../networking/clientProtocol.js'


class ImpulseController {
    constructor(controlledEntityId) {

        this.charId = controlledEntityId
        this.dir = new Vec2D()
        this._speed = 200 //xxx get default from somewhere?

        this.up = false
        this.down = false
        this.right = false
        this.left = false
    }

    get speed() {
        return this._speed
    }
    set speed(val) {
        this._speed = val
        this._sendUpdateToServer()
    }

    setUp( val ) {
        if (this.up != val) {
            this.up = val
            if(val) { this.down = false }
            this._updateImpulse()
        }
    }
    setDown( val ) {
        if (this.down != val) {
            this.down = val
            if(val) { this.up = false }
            this._updateImpulse()
        }
    }
    setRight( val ) {
        if (this.right != val) {
            this.right = val
            if(val) { this.left = false }
            this._updateImpulse()
        }
    }
    setLeft( val ) {
        if (this.left != val) {
            this.left = val
            if(val) { this.right = false }
            this._updateImpulse()
        }
    }
    _updateImpulse() {
        var x = (this.left ? -1 : (this.right ? 1 : 0))
        var y = (this.up ? -1 : (this.down ? 1 : 0))
        this.dir.setVal(x, y)

        this._sendUpdateToServer()
    }
    _sendUpdateToServer() {
        // Send new network update
        var gameTime = CastCommandTime.Get()
        ClientProtocol.instance.sendInputImpulseChange(this.charId, this.dir, this.speed, gameTime)
    }

    getVel() {
        return this.dir.getScalarMult(this.speed)
    }
}

export default ImpulseController
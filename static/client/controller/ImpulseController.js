import { Vec2D } from '../../shared/EZPZ/Vec2D.js'
import { CastCommandTime } from '../../shared/EZPZ/castengine/CastWorldModel.js'
import ClientProtocol from '../networking/ClientProtocol.js'
import GameSim from '../../shared/controller/GameSim.js';


class ImpulseController {
    constructor(controlledEntityId) {

        this.charId = controlledEntityId
        this.dir = new Vec2D()
        this.facing = 0
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
        this._updateImpulse()
    }

    setFacing( val ) {
        this.facing = val
        this._sendUpdateToServer()
    }
    // Fix facing bug - testing steps:
    //  press+hold right, 
    //  press+release up, 
    //  (observe still facing up), 
    //  release right
    // return facing of one of the directions we still have pressed down when we release the key corresponding to last pressed facing
    checkFacing() {
        var unbound = false
        switch(this.facing) {
            case 0: unbound = !this.up;  break;
            case 1: unbound = !this.right;  break;
            case 2: unbound = !this.down;  break;
            case 3: unbound = !this.left;  break;
        }
        if (unbound) {
            return this._facingForActiveDirection()
        }
        return -1
    }
    _facingForActiveDirection() {
        if (this.up) { return 0 }
        if (this.right) { return 1 }
        if (this.down) { return 2 } 
        if (this.left) { return 3 }
        return -1
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

        var entity = GameSim.instance.getEntityForId(this.charId)
        entity.vel.setVec(this.getVel())

        this._sendUpdateToServer()
    }
    _sendUpdateToServer() {
        // Send new network update
        var gameTime = CastCommandTime.Get()
        ClientProtocol.instance.sendInputImpulseChange(this.charId, this.dir, this.speed, this.facing, gameTime)
    }

    getVel() {
        return this.dir.getScalarMult(this.speed)
    }
}

export default ImpulseController
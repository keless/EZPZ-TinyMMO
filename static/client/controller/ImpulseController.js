import { Vec2D } from '../../shared/EZPZ/Vec2D.js'

class ImpulseController {
    constructor() {
        this.dir = new Vec2D();
        this.speed = 200;

        this.up = false;
        this.down = false;
        this.right = false;
        this.left = false;
    }

    setUp( val ) {
        if (this.up != val) {
        this.up = val;
        if(val) this.down = false;
        this._updateImpulse()
        }
    }
    setDown( val ) {
        if (this.down != val) {
        this.down = val;
        if(val) this.up = false;
        this._updateImpulse()
        }
    }
    setRight( val ) {
        if (this.right != val) {
        this.right = val;
        if(val) this.left = false;
        this._updateImpulse()
        }
    }
    setLeft( val ) {
        if (this.left != val) {
        this.left = val;
        if(val) this.right = false;
        this._updateImpulse()
        }
    }
    _updateImpulse() {
        var x = (this.left ? -1 : (this.right ? 1 : 0));
        var y = (this.up ? -1 : (this.down ? 1 : 0));
        this.dir.setVal(x, y);
    }

    getVel() {
        return this.dir.getScalarMult(this.speed);
    }
}

export default ImpulseController
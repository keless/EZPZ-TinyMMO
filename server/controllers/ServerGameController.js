import fs from 'fs'
import {Game} from '../models/linvoGame.js'
//import {EntityModel, EntitySchema} from '../../static/shared/model/EntityModel.js'
import { isArray, removeFromArray } from '../../static/shared/EZPZ/Utility.js'
import { Vec2D, Rect2D } from '../../static/shared/EZPZ/Vec2D.js'
import GameSim from '../../static/shared/controller/GameSim.js'
import { ResourceProvider } from '../../static/shared/EZPZ/ResourceProvider.js'
import { CastCommandTime } from '../../static/shared/EZPZ/castengine/CastWorldModel.js'
import ServerProtocol from '../networking/ServerProtocol.js';
import {performance} from 'perf_hooks'
import { EventBus } from '../../static/shared/EZPZ/EventBus.js'

//test
import {LoadingState} from '../../static/shared/EZPZ/LoadingState.js'
import { type } from 'os';

var g_instance = null

class ServerGameController {
    constructor() {
        this.verbose = true
        
        // Init server singletons
        new ResourceProvider()
        var rp = ResourceProvider.instance
        rp._fnLoadJson = (url, fnCallback) => {
            // use setImmediate: dont run until next frame to simulate client's async loading behavior
            setImmediate(()=>{
                try {
                    var data = fs.readFileSync(url)
                    var json = JSON.parse(data)
                    fnCallback(json)
                } catch (err) {
                    if (err.code === 'ENOENT') {
                        fnCallback(null)
                        console.log('File not found!');
                    } else {
                        throw err;
                    }
                }
            })
        }
        rp.serverMode = true
        rp.baseURL = "./static/"

        /* test serverMode ResourceProvider
        rp.getSprite("gfx/ui/btn_blue.sprite", ()=>{
            console.log("xxx sprite loaded on server")
        })
        */
        //this.loadResources()


        this.flagShutdown = false
        this.updateFreqMS = 1000 / 30.0 // 30 fps
        this.lastUpdateMS = performance.now()

        this.worldUpdateFreqMS = 1000 / 15.0 // 15 updates per second
        this.lastWorldUpdateMS = performance.now()

        this.gameDB = null
        this.gameSim = GameSim.instance

        this.pendingPlayerInputs = []
    }

    static get instance() {
        if (!g_instance) {
            g_instance = new ServerGameController()
        }

        return g_instance
    }

    _log(text) {
        if (this.verbose) {
            console.log(text)
        }
    }

    initialize( fnCompletion ) {
        this.loadResources(()=>{
            this.startupFromDB(fnCompletion)
        })
    }

    startupFromDB( fnCompletion ) {
        this._log("startupFromDB")
        Game.findOne({}, (err, doc)=>{
            if (!err && doc) {
                if (isArray(doc)) {
                    doc = doc[0]
                }
    
                this._log("loaded existing gameDB instance")
                this.gameDB = doc
    
                var numEntities =   this.gameDB.entities.length
                this._log(`loaded ${numEntities} entities`)
            } else {
                this._log("Created new gameDB instance")
                this.gameDB = new Game({_id:'gameID'})
            }

            setImmediate(()=>{
                this._initGameSimFromDB()

                if (fnCompletion) {
                    fnCompletion()
                }
            })
        })
    }

    _initGameSimFromDB() {
        this._log("initGameSimFromDB")
        this.gameSim = new GameSim(true)
        
        //load json
        let rawdata = fs.readFileSync('./static/gfx/levels/test2.json');
        let levelJson = JSON.parse(rawdata);
        this.gameSim.LoadMapFromJson(levelJson)

        var entitySchemas = this.gameDB.entities
        if (entitySchemas) {
            entitySchemas.forEach((entitySchema)=>{
                this.gameSim.updateEntityFromJson(entitySchema)
            })
        }

        this.update()
    }

    flushToDB(cb) {
        this._log("flushToDB")

        var gameSim = this.gameSim
        if (!gameSim || !gameSim.dirty) {
            if (cb) { cb(null); }
            return  // no changes to flush
        }

        // does this trigger re-saving the entire entity list every time? or is it smart enough to delta?
        this.gameDB.entities = []
        gameSim.m_allEntities.forEach((entity)=>{
            this._log("get schema for object")
            var schemaObject = entity.toJson()
            this.gameDB.entities.push(schemaObject)
        })

        this.gameDB.save((err)=>{
            if (err) {
                console.log("Write error")
            } else {
                console.log("game saved ")
            }
            if (cb) {
                cb(err)
            }
        })
    }

    update() {
        var currentTimeMS = performance.now()
        var currDeltaMS = currentTimeMS - this.lastUpdateMS
        var numLoopsToPerform = Math.max((currDeltaMS / this.updateFreqMS), 1)

        if (numLoopsToPerform > 2) {
            this._log("WARN: performing many loops! " + numLoopsToPerform)
        }

        // perform update ticks
        var updatePeriodS = this.updateFreqMS / 1000.0
        for (var i=0; i<numLoopsToPerform; i++) {
            // update game timer
            var ct = CastCommandTime.UpdateDelta(updatePeriodS)
            
            // apply pending user inputs
            while (this.pendingPlayerInputs.length > 0 && this.pendingPlayerInputs[0].data.gameTime <= ct) {
                var input = this.pendingPlayerInputs.shift()
                switch(input.type) {
                    case "impulse":
                        this._applyPlayerImpulse(input.data)
                        break;
                    case "ability":
                        this._applyPlayerAbility(input.data)
                        break;
                }
                

                // calculate lag between when user input happened, and when it was applied by the server to the game state
                var inputDT = ct - input.data.gameTime
                if (inputDT > 0.15) {
                    this._log(`player input process lag ${inputDT.toFixed(2)}ms`)
                }
            }

            // run simulation tick
            this.gameSim.updateStep(ct, updatePeriodS)
        }

        this.lastUpdateMS = currentTimeMS

        if (currentTimeMS - this.lastWorldUpdateMS > this.worldUpdateFreqMS) {
            ServerProtocol.instance.sendWorldUpdate()
            this.lastWorldUpdateMS = currentTimeMS
        }
        
        // set up next update timer
        if (!this.flagShutdown) {
            let timerPeriodMS = this.updateFreqMS
            setTimeout(() => {
                this.update()
            }, timerPeriodMS);
        }
    }

    queuePlayerImpulse(impulseData) {
        var ct = CastCommandTime.Get()
        /*
        if (impulseData.gameTime < ct) {
            this._log(`rcvd input from ${impulseData.gameTime.toFixed(2)}ms at ${ct.toFixed(2)}ms`)
        } else {
            this._log(`rcvd input from user in time to apply to simulation correctly`)
        }*/

        // add to queue; this will be processed in updateTick
        this.pendingPlayerInputs.push({type:"impulse", data:impulseData})
        // keep pendingPlayerInputs sorted by impulseData.gameTime (first element should be oldest gameTime)
        //xxx todo: test that sort is happening in the correct direction
        this.pendingPlayerInputs.sort((a, b)=>{
            return a.data.gameTime < b.data.gameTime
        })
    }

    queuePlayerAbility(abilityData) {
        var ct = CastCommandTime.Get()
        /*
        if (impulseData.gameTime < ct) {
            this._log(`rcvd input from ${impulseData.gameTime.toFixed(2)}ms at ${ct.toFixed(2)}ms`)
        } else {
            this._log(`rcvd input from user in time to apply to simulation correctly`)
        }*/

        // add to queue; this will be processed in updateTick
        this.pendingPlayerInputs.push({type:"ability", data:abilityData})
        // keep pendingPlayerInputs sorted by abilityData.gameTime (first element should be oldest gameTime)
        this.pendingPlayerInputs.sort((a, b)=>{
            return a.data.gameTime < b.data.gameTime
        })
    }

    _applyPlayerImpulse(impulseData) {
        var character = this.gameSim.getEntityForId(impulseData.charID)
        if (character.owner != impulseData.ownerID) {
            this._log("error: cant apply impulse to character from non-owner")
            return
        }

        var facingDidChange = false
        var wasMoving = character.vel.nonZero()

        var dir = new Vec2D(impulseData.vecDir.x, impulseData.vecDir.y)
        var speed = impulseData.speed
        if (impulseData.hasOwnProperty("facing") && character.facing != impulseData.facing) {
            character.facing = impulseData.facing
            facingDidChange = true
        }

        //xxx todo: check if character can accept (if dead dont move, etc)
        character.vel = dir.getUnitized().scalarMult(speed)
        var isMoving = character.vel.nonZero()

        var ct = impulseData.gameTime
        if (facingDidChange) {
            character.animInstance.setDirection(ct, character.facing)
        }

        // Update animation state
        if (wasMoving != isMoving) {
            if (isMoving) {
                character.animInstance.event(ct, "walk")
            } else {
                character.animInstance.event(ct, "idle")
            }
        }
    }

    //{ ownerID:uuid, charID:uuid, abilityModelID:"name:rank", gameTime:Double seconds }
    //xxx TODO: send packet to client if ability failed for some reason?
    _applyPlayerAbility(abilityData) {
        //xxx WIP
        var character = this.gameSim.getEntityForId(abilityData.charID)
        if (character.owner != abilityData.ownerID) {
            this._log("error: cant apply ability input from character as non-owner")
            return
        }

        var a = character.getAbilityForID(abilityData.abilityModelID)
        var ignoreFriendlies = [ character ];
        if( a.isIdle() && a.canAfford() ) {
            //attempt to find target for ability
            var abilityRange = a.getRange();
        
            var targetEntity = null;
            if(a.isSelfTargeted()) {
                //if healing spell, target self
                targetEntity = character;
            } else {
                //if damaging spell, target enemy
                var gameSim = GameSim.instance
                var targetEntities = gameSim.GetEntitiesInRadius( character.pos, abilityRange, ignoreFriendlies );
                if( targetEntities.length != 0 ) {
                    targetEntity = targetEntities[0];

                    //todo: handle AOE
                }
            }

            if (targetEntity) {
                var targetGroup = character.getTarget();
                targetGroup.clearTargetEntities();
                targetGroup.addTargetEntity(targetEntity);
                
                a.startCast();
            }
        }
    }

    loadResources(fnCB) {
        //xxx todo: share this with client as .json resource instead of duplicating
        var resources = [
            "gfx/ui/btn_blue.sprite",
            "gfx/ui/btn_dark.sprite",
            "gfx/ui/btn_white.sprite",
            "gfx/ui/btn_white_sm.sprite",
            "gfx/items/arm_cloth.sprite",
            "gfx/items/arm_leather.sprite",
            "gfx/items/arm_metal.sprite",
            "gfx/items/icon_book.sprite",
            "gfx/items/icon_gear.sprite",
            "gfx/items/icon_grind.sprite",
            "gfx/items/icon_map.sprite",
            "gfx/items/icon_rest.sprite",
            "gfx/items/icon_return.sprite",
            "gfx/items/icon_stop.sprite",
            "gfx/items/weap_mace.sprite",
            "gfx/items/weap_bow.sprite",
            "gfx/items/weap_axe.sprite",
            "gfx/items/weap_staff.sprite",
            "gfx/items/weap_dagger.sprite",
            "gfx/items/weap_sword.sprite",
            "gfx/abilities/abilityIcons.sprite",
            "gfx/items/craft_cloth.sprite",
            "gfx/items/craft_leather.sprite",
            "gfx/items/craft_metal.sprite",
            //"gfx/avatars/centaur_idle.sprite",
            //"gfx/avatars/centaur_attack.sprite",
            //"gfx/avatars/dwarf_idle.sprite",
            //"gfx/avatars/dwarf_attack.sprite",
            //"gfx/avatars/elf_idle.sprite",
            //"gfx/avatars/elf_attack.sprite",
            //"gfx/avatars/gnome_idle.sprite",
            //"gfx/avatars/gnome_attack.sprite",
            //"gfx/avatars/goblin_idle.sprite",
            //"gfx/avatars/goblin_attack.sprite",
            //"gfx/avatars/human_idle.sprite",
            //"gfx/avatars/human_attack.sprite",
            //"gfx/avatars/orc_idle.sprite",
            //"gfx/avatars/orc_attack.sprite",
            "gfx/avatars/avatar.anim",
            "gfx/avatars/avatars.spb",
            "gfx/levels/test.json",
            "gfx/levels/test2.json",
            "fpql:gfx/avatars/avatar.anim:centaur_",
			"fpql:gfx/avatars/avatar.anim:dwarf_",
			"fpql:gfx/avatars/avatar.anim:elf_",
			"fpql:gfx/avatars/avatar.anim:gnome_",
			"fpql:gfx/avatars/avatar.anim:goblin_",
			"fpql:gfx/avatars/avatar.anim:human_",
			"fpql:gfx/avatars/avatar.anim:orc_"
        ];
        var RP = ResourceProvider.instance
        resources.forEach((loadingName)=>{
            if (loadingName.substr(0, 4) == "fpql") {
                //Handle fourpoleanimation quickload
                var params = loadingName.split(":")
                var fileName = params[1]
                var baseName = params[2]
                //console.log("LoadingState - quick load fourpoleanim " + fileName + " " + baseName)
                RP.loadFourPoleAnimationQuickAttach(fileName, baseName, (e)=>{
                    removeFromArray(resources, loadingName)
                    if (resources.length == 0) {
                        fnCB()
                    }
                })
            } else if (loadingName.substr(0, 2) == "ql") {
                //Handle animation quickload
                var params = loadingName.split(":")
                var fileName = params[1]
                var baseName = params[2]
                //console.log("LoadingState - quick load animation " + fileName + " " + baseName)
                RP.loadAnimationQuickAttach(fileName, baseName, (e)=>{
                    removeFromArray(resources, loadingName)
                    if (resources.length == 0) {
                        fnCB()
                    }
                })
            } else {
                //Handle normal extension detection
                var ext = loadingName.substr(loadingName.lastIndexOf('.') + 1);

                switch (ext) {
                    case "png":
                    case "PNG":
                    case "bmp":
                    case "BMP":
                    case "jpg":
                    case "JPG":
                        // dont load images on server
                        console.log("WARN: server wont load images")
                        removeFromArray(resources, loadingName)
                        break;
                    case "sprite":
                        RP.loadSprite(loadingName, (e)=>{
                            removeFromArray(resources, loadingName)
                            if (resources.length == 0) {
                                fnCB()
                            }
                        });
                        break;
                    case "spb":
                        RP.loadSpriteBatch(loadingName, (e)=>{
                            removeFromArray(resources, loadingName)
                            if (resources.length == 0) {
                                fnCB()
                            }
                        });
                        break;
                    //case "anim":
                    //case "json":
                    default:
                        RP.loadJson(loadingName, (e)=>{
                            removeFromArray(resources, loadingName)
                            if (resources.length == 0) {
                                fnCB()
                            }
                        });
                        break;
                }
            }
        })
    }
}

export default ServerGameController
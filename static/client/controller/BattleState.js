import { AppState, BaseStateModel, NodeView, Service, CastCommandTime, TiledMap } from '../clientEZPZ.js'
//import PlayerModel from '../../shared/model/PlayerModel.js'
import GameSim from '../../shared/controller/GameSim.js'
import BattleStateView from '../view/BattleView.js'
import ResourceProvider from '../../shared/EZPZ/ResourceProvider.js';
import ImpulseController from './ImpulseController.js'

export default class BattleState extends AppState {
	constructor(params) { 
		super();
		this.model = new BattleStateModel(this, params.locationIdx, params.controlledEntityId);
		this.view = new BattleStateView(this.model);
	}

}

// conforms to ICastPhysics 
class BattleStateModel extends BaseStateModel {
	constructor( state, locationIdx, controlledEntityId ) {
		super();
		
		console.log("battle at location " + locationIdx);
		this.locationIdx = locationIdx;
		this.controlledEntityId = controlledEntityId

		this.gameSim = GameSim.instance

		var RP = ResourceProvider.instance
		var levelJson = RP.getJson("gfx/levels/test2.json")
		this.gameSim.LoadMapFromJson(levelJson, false)

		this.playerImpulse = new ImpulseController(this.controlledEntityId)
		this.playerEntity = this.gameSim.getEntityForId(this.controlledEntityId)

		this.pState = state;
		
		this.controllers = [];


		/*
		this.SetListener("btnMapLoc", this.onBtnMapLoc);
		this.SetListener("btnEquipSlot", this.onBtnEquipSlot);
		this.SetListener("btnInvSlot", this.onBtnInvSlot);
		this.SetListener("intentRest", this.onPlayerRest, EventBus.game);
		this.SetListener("playerReturn", this.onPlayerReturn, EventBus.game);

		this.SetListener("intentIdleMode", this.onPlayerIntentIdle, EventBus.game);
		this.SetListener("intentGrindMode", this.onPlayerIntentGrind, EventBus.game);

		this.SetListener("setPctRest", this.onSetRestPct, EventBus.game);
		*/

		Service.Add("battleStateModel", this);
	}
	
	Destroy() {

		//this.playerModel.entity.removeListener("dead", this.onPlayerDeath.bind(this));

		for( var e of this.controllers ) {
			e.Destroy();
		}
		this.controllers = [];

		Service.Remove("battleStateModel");

		super.Destroy();
	}

/*
	setMode(mode) {
		switch(mode) {
			case BattleState.MODE_IDLE:
			if(this.mode != BattleState.MODE_IDLE) {
				this.mode = mode;
				this.removeAllEnemyEntities();
				this.controllers[0].pause();
				this.gameSim.entities[0].stopAllCasting();
				EventBus.game.dispatch({evtName:"battleModeChanged", mode:this.mode});
			}
			break;
			case BattleState.MODE_GRIND:
			if(this.mode != BattleState.MODE_GRIND) {
				this.mode = mode;
				this.controllers[0].unpause();
				EventBus.game.dispatch({evtName:"battleModeChanged", mode:this.mode});
			}
			break;
		}
	}
	*/


	onBtnEquipSlot(e) {
		var slotIdx = e.idx;
		if(this.mode == BattleState.MODE_IDLE || this.isGhostRestReturn()) {
			//try to unequip item
			if(this.playerModel.attemptUnequipToInv(slotIdx)) {
				this.playerModel.save();
			}
		}
	}

	onBtnInvSlot(e) {
		var slotIdx = e.idx;
		if(this.mode == BattleState.MODE_IDLE || this.isGhostRestReturn()) {
			//try to equip/swap item
			if(this.playerModel.attemptEquipFromInvSlot(slotIdx)) {
				this.playerModel.save();
			}
		}
	}

	onBtnMapLoc(e) {
		//var locIdx = e.idx;
		Service.Get("state").gotoState("location", e.idx);
	}
	
	/*
	addPlayerEntity( ent ) {
		if(this.gameSim.entities.length == 0) {
			this.gameSim.entities.push(ent);
		}else {
			console.error("overriding player entity, probably bad");
			this.gameSim.entities[0] = ent;
		}

		ent.addListener("dead", this.onPlayerDeath.bind(this));
		
		var controller = new AIController(ent);
		this.controllers.push(controller);

		EventBus.game.dispatch({evtName:"entitySpawned"});
	}
	*/

	/*
	addEntity( ent ) {
		this.gameSim.entities.push(ent);
		var controller = new AIController(ent);
		this.controllers.push(controller);

		ent.addListener("dead", this.onEnemyDeath.bind(this));

		EventBus.game.dispatch({evtName:"entitySpawned"});
	}
	removeEntity(ent) {
		if(removeFromArray(this.gameSim.entities, ent)) {
			ent.stopAllCasting();
			ent.removeListener("dead", this.onEnemyDeath.bind(this));
			for(var i=0; i<this.controllers.length; i++) {
				var controller = this.controllers[i];
				if(controller.pEntityModel == ent) {
					this.controllers.splice(i, 1);
					controller.Destroy();
					break;
				}
			}
			ent.Destroy();
			EventBus.ui.dispatch({evtName:"entityRemoved"});
		}
	}
	

	onPlayerDeath(e) {
		console.log("todo: on player death");

		//1) remove all enemy entities
		this.removeAllEnemyEntities();
		//2) start ghosting
		var playerEntity = this.playerModel.entity;

		EventBus.ui.dispatch({evtName:"playerDied", timeOfDeath:playerEntity.deadTime, ghostPeriod:this.playerModel.ghostPeriod });
	}

	removeAllEnemyEntities() {
		for(var i=this.gameSim.entities.length-1; i>0; i--) {
			this.removeEntity(this.gameSim.entities[i]);
		}
	}

	onPlayerRest(e) {
		console.log("on player rest");
		this._doRest();
	}
	_doRest() {
		this.removeAllEnemyEntities();

		this.playerModel.restStart( CastCommandTime.Get() );
		this.controllers[0].pause();

		EventBus.ui.dispatch({evtName:"playerRest"});
	}
	

	onEnemyDeath(e) {
		console.log("on enemy death");
		//gather XP & loot drop, give to player
		var entity = e.entity;
		var xpGained = entity.xp_next;
		this.playerModel.gainXP(xpGained);

		var goldFound = entity.getGold();
		goldFound = ~~(goldFound * (1 + this.playerModel.getGoldFindModifier()));
		this.playerModel.incGold(goldFound);

		var loot = SpawnFactory.DropLootForEnemy(entity);
		this.playerModel.addItem(loot);

		this.removeEntity(entity);
	}*/

	Update(ct, dt) {
		super.Update(ct, dt);
		
		ct = CastCommandTime.Get();

		for( var c of this.controllers ) {
			c.Update(ct, dt);
		}

		this.gameSim.updateStep(ct, dt)
		
	}
	
	/*
	doPlayerRespawn() {
		this.playerModel.respawn();
		this.controllers[0].unpause();
		EventBus.ui.dispatch({evtName:"playerRespawned"});
	}

	doPlayerRestEnd() {
		this.playerModel.restEnd();
		this.controllers[0].unpause();
		EventBus.ui.dispatch({evtName:"restEnded"});
		this.isPaused = false;
	}

	doSpawnLogic(ct) {
		if(this.playerModel.entity.isDead) {
			return; //dont spawn while player is dead
		}
		if(this.gameSim.entities.length < 2) {
			var enemy = SpawnFactory.SpawnEnemyForLocation(this.locationIdx, this.playerModel);
			this.addEntity(enemy);
		}
	}*/

	// conforms to ICastPhysics
	// in: ICastEntity fromEntity, ICastEntity toEntity
	// out: null or Vec2D distVec
	GetVecBetween( fromEntity, toEntity ) { 
		var from = fromEntity.pos;
		var to = toEntity.pos;

		return to.getVecSub(from); 
	}
	
	// in: ICastEntity entity
	// out: null or Vec2D pos
	GetEntityPosition( entity ) { 
		return entity.pos;
	}
	
	// in: Vec2D p, float r
	// out: array<ICastEntity> entities
	GetEntitiesInRadius( p, r, ignore ) { 
		
		var inRadius = [];
		var rSq = r * r;
		
		for( var e of this.gameSim.entities ) {
			
			if( ignore && arrayContains(ignore, e) ) continue;
			
			var dSq = e.pos.getDistSqFromVec(p);
			if( dSq < rSq ) {
				inRadius.push(e);
			}
		}
		
		return inRadius; 
	}
}

export { BattleState, BattleStateModel }
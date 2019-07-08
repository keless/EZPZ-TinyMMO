import { AppState, BaseStateModel, NodeView, Service } from '../clientEZPZ.js'
import PlayerModel from '../../shared/model/PlayerModel.js'

export default class BattleState extends AppState {
	constructor(locationIdx) { 
		super();
		this.model = new BattleStateModel(this, locationIdx);
		this.view = new BattleStateView(this.model);

		this.model.setMode(BattleState.MODE_GRIND);
	}

	static get MODE_GRIND(){ return 1; }
	static get MODE_IDLE() { return 2; }
}

// conforms to ICastPhysics 
class BattleStateModel extends BaseStateModel {
	constructor( state, locationIdx ) {
		super();
		
		this.mode = BattleState.MODE_IDLE;

		console.log("battle at location " + locationIdx);
		this.locationIdx = locationIdx;
		this.isPaused = false;

		this.isReturning = false;
		this.returnTime = 0;

		this.pState = state;
		
		this.entities = [];
		this.controllers = [];

		this.castWorldModel = CastWorldModel.Get();
		this.castWorldModel.setPhysicsInterface( this );

		this.playerModel = PlayerModel.Get();
		this.addPlayerEntity(this.playerModel.entity);

		//ensure player is registered in cast world after multiple returns
		this.castWorldModel.RemoveEntity(this.playerModel.entity);
		this.castWorldModel.AddEntity(this.playerModel.entity);

		this.SetListener("btnMapLoc", this.onBtnMapLoc);
		this.SetListener("btnEquipSlot", this.onBtnEquipSlot);
		this.SetListener("btnInvSlot", this.onBtnInvSlot);
		this.SetListener("intentRest", this.onPlayerRest, EventBus.game);
		this.SetListener("playerReturn", this.onPlayerReturn, EventBus.game);

		this.SetListener("intentIdleMode", this.onPlayerIntentIdle, EventBus.game);
		this.SetListener("intentGrindMode", this.onPlayerIntentGrind, EventBus.game);

		this.SetListener("setPctRest", this.onSetRestPct, EventBus.game);

		Service.Add("battleStateModel", this);
	}
	
	Destroy() {
		this.playerModel.entity.removeListener("dead", this.onPlayerDeath.bind(this));

		for( var e of this.entities ) {
			e.removeListener("dead", this.onEnemyDeath.bind(this));
			e.Destroy();
		}
		this.entities = [];

		for( var e of this.controllers ) {
			e.Destroy();
		}
		this.controllers = [];

		Service.Remove("battleStateModel");

		super.Destroy();
	}

	onPlayerIntentIdle(e) {
		this.setMode(BattleState.MODE_IDLE);
	}

	onPlayerIntentGrind(e) {
		this.setMode(BattleState.MODE_GRIND);
	}

	onSetRestPct(e) {
		this.playerModel.setRestPct(e.pct);
		this.playerModel.save();
	}

	setMode(mode) {
		switch(mode) {
			case BattleState.MODE_IDLE:
			if(this.mode != BattleState.MODE_IDLE) {
				this.mode = mode;
				this.removeAllEnemyEntities();
				this.controllers[0].pause();
				this.entities[0].stopAllCasting();
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

	//return true if ghosting, resting or returning
	isGhostRestReturn() {
		return this.playerModel.isGhost() || this.playerModel.isResting() || this.isReturning;
	}

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

	pause() {
		this.isPaused = true;
	}
	unpause() {
		this.isPaused = false;
	}

	getRestPeriod() {
		return this.playerModel.restPeriod;
	}
	getReturnPeriod() {
		return this.playerModel.returnPeriod;
	}

	onBtnMapLoc(e) {
		//var locIdx = e.idx;
		Service.Get("state").gotoState("location", e.idx);
	}
	
	addPlayerEntity( ent ) {
		if(this.entities.length == 0) {
			this.entities.push(ent);
		}else {
			console.error("overriding player entity, probably bad");
			this.entities[0] = ent;
		}

		ent.addListener("dead", this.onPlayerDeath.bind(this));
		
		var controller = new AIController(ent);
		this.controllers.push(controller);

		EventBus.game.dispatch({evtName:"entitySpawned"});
	}

	addEntity( ent ) {
		this.entities.push(ent);
		var controller = new AIController(ent);
		this.controllers.push(controller);

		ent.addListener("dead", this.onEnemyDeath.bind(this));

		EventBus.game.dispatch({evtName:"entitySpawned"});
	}
	removeEntity(ent) {
		if(removeFromArray(this.entities, ent)) {
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
		for(var i=this.entities.length-1; i>0; i--) {
			this.removeEntity(this.entities[i]);
		}
	}

	onPlayerRest(e) {
		console.log("on player rest");
		this._doRest();
	}
	_doRest() {
		this.removeAllEnemyEntities();

		this.isPaused = true;
		this.playerModel.restStart( CastCommandTime.Get() );
		this.controllers[0].pause();

		EventBus.ui.dispatch({evtName:"playerRest"});
	}

	onPlayerReturn(e) {
		this.playerModel.stopAllCasting();
		this.controllers[0].pause();
		this.isReturning = true;
		this.isPaused = true;
		this.returnTime = CastCommandTime.Get();
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
	}

	Update(ct, dt) {
		super.Update(ct, dt);
		
		this.castWorldModel.updateStep(dt);
		ct = CastCommandTime.Get();
			
		if(!this.isPaused) {
			if(this.mode == BattleState.MODE_GRIND) {

				if(this.playerModel.shouldRest()) {
					if( this.entities.length == 1 ) {
						//only rest if out of combat
						this._doRest();
					}
					
				}else {

					//check if player has skills equipped, if not, dont let them grind
					if(this.playerModel.entity.getAbilities().length == 0 ) {
						EventBus.ui.dispatch({evtName:"noSkillsAlert"});
						this.setMode(BattleState.MODE_IDLE);
					} else {
						this.doSpawnLogic(ct);
					}
				}
			}
			
			for( var e of this.entities ) {
				e.Update(ct, dt);
			}
			for( var c of this.controllers ) {
				c.Update(ct, dt);
			}
		}

		if(this.playerModel.isGhost() && this.playerModel.shouldRespawn(ct)) {
			this.doPlayerRespawn();
		}
		if(this.playerModel.isResting() && this.playerModel.shouldFinishResting(ct)) {
			this.doPlayerRestEnd();
		}
		if(this.isReturning && ct > this.returnTime + this.playerModel.returnPeriod) {
			Service.Get("state").gotoState("location", this.locationIdx);
		}

		this.playerModel.save();
		
	}
	
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
		if(this.entities.length < 2) {
			var enemy = SpawnFactory.SpawnEnemyForLocation(this.locationIdx, this.playerModel);
			this.addEntity(enemy);
		}
	}

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
		
		for( var e of this.entities ) {
			
			if( ignore && arrayContains(ignore, e) ) continue;
			
			var dSq = e.pos.getDistSqFromVec(p);
			if( dSq < rSq ) {
				inRadius.push(e);
			}
		}
		
		return inRadius; 
	}
}

export { BattleState }
import { BaseStateView, NodeView, ButtonView, Graphics, CreateSimpleProgressBar, Service, Animation, EventBus, TableView } from '../clientEZPZ.js'
import {BattleStateModel} from '../controller/BattleState.js'
import {EntityView, AbilityView} from './EntityView.js'
import ResourceProvider from '../../shared/EZPZ/ResourceProvider.js'
import { TiledMapNodeView, TiledMap } from '../../shared/EZPZ/TiledMap.js'
import GameSim from '../../shared/controller/GameSim.js';
import InventoryHudView from './InventoryView.js'
import PlayerHudView from './PlayerHudView.js'
import { CastCommandTime } from '../../shared/EZPZ/castengine/CastCommand.js';
import ClientProtocol from '../networking/ClientProtocol.js';
import Vec2D from '../../shared/EZPZ/Vec2D.js';
import HUDTargetView from './HUDTargetView.js'
import ClientGameController from '../controller/ClientGameController.js';

export default class BattleStateView extends BaseStateView {
	constructor( model ) {
		super();
		
		this.pModel = model;

		this.controlledEntity = this.pModel.playerEntity
		this.avatarNode = null
		this.entityViews = []

		this.MAX_TARGET_RANGE = 1000

		/*
		this.playerView = null;
		this.stratView = null;
		this.noSkillsView = null;
		this.ghostView = null;
		this.abilityInfoView = null;
		this.mapView = null;
		*/

		this.mapNode = new TiledMapNodeView(this.pModel.gameSim.map)
		this.rootView.addChild(this.mapNode)
		
		this.mapNode.fnDrawPlayerLayer = (gfx, x,y, ct)=>{
			//var a = self.pModel.player.physicsEntity.getArea();
			//gfx.drawRect(x + a.x, y + a.y, a.w, a.h)

			//sort based on "y" value (so things in "front" draw last/on top)
			this.entityViews.sort((a, b)=>{
				return a.pos.y - b.pos.y
			})

			this.entityViews.forEach((entityView)=>{
				entityView.Draw(gfx, x,y, ct)
			})
		}

    var screenSize = Graphics.ScreenSize;
		//var loc = g_locations[this.pModel.locationIdx];

		var navX = screenSize.x - 25;

		this.btnBack = new ButtonView("btnBack", "gfx/items/icon_return.sprite");
		this.btnBack.pos.setVal(navX, 25);
		this.rootView.addChild(this.btnBack);
		this.SetListener("btnBack", this.onBtnBack);

		this.btnMap = new ButtonView("btnMap", "gfx/items/icon_map.sprite");
		this.btnMap.pos.setVal(navX, 75);
		this.rootView.addChild(this.btnMap);
		//this.SetListener("btnMap", this.onBtnMap);

		this.btnRest = new ButtonView("btnRest", "gfx/items/icon_rest.sprite");
		this.btnRest.pos.setVal(navX - 50, 25);
		this.rootView.addChild(this.btnRest);
		//this.SetListener("btnRest", this.onBtnRest);

		this.btnStrat = new ButtonView("btnStrat", "gfx/items/icon_gear.sprite");
		this.btnStrat.pos.setVal(navX - 50, 75);
		this.rootView.addChild(this.btnStrat);
		//this.SetListener("btnStrat", this.onBtnStrat);
    
		this.btnSkills = new ButtonView("btnSkills", "gfx/items/icon_book.sprite");
		this.btnSkills.pos.setVal(navX - 100, 75);
		this.rootView.addChild(this.btnSkills);
		//this.SetListener("btnSkills", this.onBtnSkills);

		this.fpsMeter = new NodeView()
		this.fpsMeter.setLabel("000 u/s", "16px Arial")
		this.fpsMeter.pos.setVal(navX - 150, 75)
		this.rootView.addChild(this.fpsMeter)

		this.lagMeter = new NodeView()
		this.lagMeter.setLabel("00 ms", "16px Arial")
		this.lagMeter.pos.setVal(navX - 150, 90)
		this.rootView.addChild(this.lagMeter)

		this.SetListener("gameSimUpdate", (e)=>{
			var gameSim = GameSim.instance
			this.fpsMeter.updateLabel( gameSim.getGameUpdatesPerSecond().toFixed(2) + " u/s")

			var clientProtocol = ClientProtocol.instance
			this.lagMeter.updateLabel( clientProtocol.getLagMS().toFixed(2) + "ms" )
		}, EventBus.game)
		
		this.SetListener("errNoTarget", (e)=>{
			var node = new NodeView()
			node.setLabel("No Target", "16px Arial bold")
			node.pos.setVal(screenSize.x/2, 25)
			this.rootView.addChild(node)
			node.tweenPosDelta(2, new Vec2D(0, -20), ()=>{
				node.tweenRemoveFromParent(0)
			})

			
		}, EventBus.ui)

    this.playerAbilities = new TableView(screenSize.x, 80);
    this.playerAbilities.direction = TableView.HORIZONTAL;
    this.playerAbilities.setRect(screenSize.x, 80, "#444444");
    this.playerAbilities.pos.setVal(screenSize.x/2, screenSize.y - 40);
    this.rootView.addChild(this.playerAbilities);

		this.xpBar = CreateSimpleProgressBar("#BBBBFF", "#DDDDDD", screenSize.x, 15);
		this.xpBar.pct = 0;
		this.xpBar.setLabel(0 + " / " + 0, "8px Arial", "#000000");
		this.xpBar.pos.setVal(screenSize.x/2, screenSize.y - 90);
		this.rootView.addChild(this.xpBar);

		this.modeHud = new ModeHudView();
		this.modeHud.pos.setVal(screenSize.x - this.modeHud.size.x/2, 198);
		this.rootView.addChild(this.modeHud);

		this.inventoryHud = new InventoryHudView(this.pModel.playerModel);
		this.inventoryHud.pos.setVal(screenSize.x - this.inventoryHud.size.x/2, 425);
		this.rootView.addChild(this.inventoryHud);

		this.playerHud = new PlayerHudView(this.controlledEntity);
		this.playerHud.pos.setVal(screenSize.x - this.playerHud.size.x/2, 652);
		this.rootView.addChild(this.playerHud);
		
		this.targetHud = new HUDTargetView()
		this.targetHud.pos.setVal(screenSize.x/2, 30) 
		this.rootView.addChild(this.targetHud)

		/*
    playerEntity.addListener("update", this.onPlayerModelUpdate.bind(this));
		playerEntity.addListener("castEnd", this.onPlayerModelAttack.bind(this));

		this.SetListener("entitySpawned", this.onEntitySpawned, EventBus.game);
		this.SetListener("entityRemoved", this.onEntityRemoved);
		this.SetListener("playerDied", this.onPlayerDeath);
		this.SetListener("playerRespawned", this.onPlayerRespawned);
		this.SetListener("restEnded", this.onRestEnded);
		this.SetListener("btnDismissMap", this.onDismissMap);
		this.SetListener("playerRest", this.onPlayerRest);
		this.SetListener("btnCloseStrat", this.onBtnCloseStrat);
		this.SetListener("btnCloseSkills", this.onBtnCloseSkills);
    this.SetListener("battleModeChanged", this.onBattleModeChanged, EventBus.game);

		
		this.SetListener("btnCloseAbilityView", this.onBtnCloseAbilityView);

		this.SetListener("noSkillsAlert", this.onShowNoSkillsAlert);
		this.SetListener("btnCloseNoSkillsAlert", this.onHideNoSkillsAlert);

		this.refreshXPBarView();
			*/
			
		this.SetListener("abilityViewClicked", this.onAbilityViewClicked);

		this.enemyLayer = new NodeView();
		this.rootView.addChild(this.enemyLayer);

		this.progresslayer = new NodeView();
		this.rootView.addChild(this.progresslayer);
		
		this.refreshEntityViews();

		this.topView = new NodeView();
		this.rootView.addChild(this.topView);

		this._rebuildAllAbilities(this.controlledEntity)
	}

	
	OnKeyDown(e, x, y) {
		if (!this.avatarNode) { return }
		var ct = 0;
		//console.log("test keydown " + e.keyCode)
		switch(e.keyCode) {
		  case 'E'.charCodeAt(0): //up
			//this.avatarNode.setDirection(ct, 0);
			//this.avatarNode.animEvent(0, "walk");
			this.pModel.playerImpulse.setFacing(0);
			this.pModel.playerImpulse.setUp(true);
			
		  break;
		  case 'D'.charCodeAt(0): //down
			//this.avatarNode.setDirection(ct, 2);
			//this.avatarNode.animEvent(0, "walk");
			this.pModel.playerImpulse.setFacing(2);
			this.pModel.playerImpulse.setDown(true);
			
		  break;
		  case 'F'.charCodeAt(0): //right
			//this.avatarNode.setDirection(ct, 1);
			//this.avatarNode.animEvent(0, "walk");
			this.pModel.playerImpulse.setFacing(1);
			this.pModel.playerImpulse.setRight(true);
			
		  break;
		  case 'S'.charCodeAt(0): //left
			//this.avatarNode.setDirection(ct, 3);
			//this.avatarNode.animEvent(0, "walk");
			this.pModel.playerImpulse.setFacing(3);
			this.pModel.playerImpulse.setLeft(true);
			break;

			case '\t'.charCodeAt(0): //tab
			e.preventDefault();
			this._tabTarget();
			break;
			
			case 'M'.charCodeAt(0): 
			console.log(this.avatarNode.pos.toJson())
			break;
		}

		//handle number keys as range
		if (e.keyCode >= '1'.charCodeAt(0) && e.keyCode <= '9'.charCodeAt(0)) {
			var numberKey = e.keyCode - '1'.charCodeAt(0)
			this.onAbilityHotKey(numberKey)
		}
	}

	_tabTarget() {
		//get list of entities minus self, and current target if one is selected
		var gameController = ClientGameController.instance
		var gameSim = GameSim.instance

		var castTarget = this.controlledEntity.getTarget()
		var ignoreList = castTarget.getEntityList().slice(0)
		ignoreList.push(this.controlledEntity)

		var potentialTargets = gameSim.GetEntitiesInRadius( this.controlledEntity.pos, this.MAX_TARGET_RANGE, ignoreList)
		if (potentialTargets.length > 0) {
			//sort by distance
			var playerPos = this.controlledEntity.pos
			potentialTargets.sort((a, b)=>{
				var distSqA = playerPos.getDistSqFromVec(a.pos)
				var distSqB = playerPos.getDistSqFromVec(b.pos)
				return distSqA - distSqB
			});

			//pick closest
			var targetEntity = potentialTargets[0]
			gameController.setTarget(targetEntity)
		} else {
			//clear target
			gameController.setTarget(null)
		}
	}
	
	OnKeyUp(e, x, y) {
		if (!this.avatarNode) { return }
		var ct = 0;
		var shouldCheckFacing = false
		switch(e.keyCode) {
		  case 'E'.charCodeAt(0):
			//this.avatarNode.animEvent(ct, "idle")
			this.pModel.playerImpulse.setUp(false)
			shouldCheckFacing = true
		  break;
		  case 'D'.charCodeAt(0):
			//this.avatarNode.animEvent(ct, "idle")
			this.pModel.playerImpulse.setDown(false)
			shouldCheckFacing = true
		  break;
		  case 'F'.charCodeAt(0):
			//this.avatarNode.animEvent(ct, "idle")
			this.pModel.playerImpulse.setRight(false)
			shouldCheckFacing = true
		  break;
		  case 'S'.charCodeAt(0):
			//this.avatarNode.animEvent(ct, "idle")
			this.pModel.playerImpulse.setLeft(false)
			shouldCheckFacing = true
		  break;
		}

		if (shouldCheckFacing) {
			console.log("check facing")
			var newFacing = this.pModel.playerImpulse.checkFacing()
			if (newFacing != -1) {
				console.log("snap to " + newFacing)
				//this.avatarNode.setDirection(ct, newFacing)
				this.pModel.playerImpulse.setFacing(newFacing);
			}
		}
	}
	

	onBtnCloseAbilityView(e) {
		this._hideAbilityInfoView();
	}

	onAbilityViewClicked(e) {
		this._hideAbilityInfoView();

		var abilityId = e.abilityId;
		this._sendAbility(abilityId)
	}

	onAbilityHotKey(idx) {
		var abilityId = this.controlledEntity.getAbilityIdAtIdx(idx)
		if (abilityId) {
			this._sendAbility(abilityId)
		}
	}

	_sendAbility(abilityId) {
				/*
		var playerModel = PlayerModel.Get();
		var skillModel = playerModel.getSkillsModel();
		var rank = skillModel.getSkillRanks(abilityId);
		var window = new AbilityInfoView(abilityId, rank);
		window.pos.y -= 135;

		var parent = this.abilityViews[idx];
		parent.addChild(window);

		this.abilityInfoView = window;
		*/

		var gameController = ClientGameController.instance
		

		//send command to server
		var gameTime = CastCommandTime.Get()
		ClientProtocol.instance.sendAbility(this.controlledEntity.getID(), abilityId, gameController.playerTarget.toJson(), gameTime)
	}

	_hideAbilityInfoView() {
		if(this.abilityInfoView != null) {
			this.abilityInfoView.removeFromParent(true);
			this.abilityInfoView = null;
		}
	}

	onPlayerModelAttack(e) {
		var ct = Application.getTime();

		if(!e.ability.isSelfTargeted()) {
			this.playerView.avatar.animEvent(ct, "attack");
		}	
	}

/*
	_removeGhostView() {
		if(this.ghostView) {
			this.progresslayer.removeChild(this.ghostView, true);
			this.ghostView = null;
		}
	}

	_showGhostView(ghostPeriod) {
		this.ghostView = CreateScreenShade();
		var bar = CreateSimpleProgressBar("rgb(255,255,255)", "rgb(255,0,0)", 400, 60);
		bar.pct = 0;
		bar.setTween("pct", ghostPeriod, 1);
		bar.setLabelWithOutline("Respawning...", "12px Arial");
		bar.pos.setVal(0,-200);
		this.ghostView.addChild(bar);
		this.progresslayer.addChild(this.ghostView);
	}

	onPlayerDeath(e) {
		this._removeGhostView();

		this._showGhostView(e.ghostPeriod);

		this._updateAllAbilities();
	}

	onPlayerRespawned(e) {
		this._removeGhostView();
	}
*/
	Draw( g, x,y, ct) {
		ct = CastCommandTime.Get()
		super.Draw(g, x,y, ct)
	}

	onBtnBack(e) {
		Service.Get("state").gotoState("manager")

		/*
		EventBus.game.dispatch({evtName:"playerReturn"});

		var dt = this.pModel.getReturnPeriod();

		this._removeGhostView();

		this.ghostView = CreateScreenShade();
		var bar = CreateSimpleProgressBar("rgb(255,255,255)", "rgb(0,0,255)", 400, 60);
		bar.pct = 0;
		bar.setTween("pct", dt, 1);
		bar.setLabelWithOutline("Returning...", "12px Arial");
		bar.pos.setVal(0,-200);
		this.ghostView.addChild(bar);
		this.progresslayer.addChild(this.ghostView);
		*/
	}

	onPlayerModelUpdate(e) {
		this._updateAllAbilities();
	}
	
	_updateAllAbilities() {
    for( var i in this.abilityViews ) {
			var av = this.abilityViews[i];
			av.updateFromModel();
		}
	}

	_rebuildAllAbilities(entityModel) {
		//remove old abilities
		this.playerAbilities.removeAllCells();
		this.abilityViews = []
		
		var abilities = entityModel.getAbilities();
		for( var i=0; i< abilities.length; i++) {
			var a = abilities[i];
			var av = new AbilityView(a);
			(function(idx, ability){
				av.setClick(function(e, x,y){
					EventBus.ui.dispatch({evtName:"abilityViewClicked", idx:idx, abilityId:ability.getModelID()});
				});
			}(i, a));
			this.playerAbilities.addCell(av);
			this.abilityViews.push(av);
		}

		var passiveAbilities = entityModel.getPassiveAbilities();
		for( var i=0; i< passiveAbilities.length ; i++) {
			var a = passiveAbilities[i];
			var av = new AbilityView(a);
			(function(idx, ability){
				av.setClick(function(e, x,y){
					EventBus.ui.dispatch({evtName:"abilityViewClicked", idx:idx, abilityId:ability.getModelID()});
				});
			}(i + abilities.length, a));
			this.playerAbilities.addCell(av);
			this.abilityViews.push(av);
		}
	}
	

	onEntitySpawned(e) {
		//xxx TODO: dont recreate ALL views just to add a new one
		this.refreshEntityViews();
	}
	onEntityRemoved(e) {
		this.refreshEntityViews();
		this.refreshXPBarView();
	}

	refreshXPBarView() {
		var playerEntity = this.pModel.playerEntity
		this.xpBar.updateLabel(playerEntity.xp_curr + " / " + playerEntity.xp_next);
		this.xpBar.pct = playerEntity.xp_curr / playerEntity.xp_next;
	}

	refreshEntityViews() {
		this.removeAllEntityViews();

		this.pModel.gameSim.m_allEntities.forEach((entity)=>{
			this.createEntityView(entity)
		})
	}

	removeAllEntityViews() {
		for(var i=0; i<this.entityViews.length; i++ ) {
			this.enemyLayer.removeChild(this.entityViews[i], true);
		}
		this.entityViews = [];
	}

	createEntityView( entityModel ) {
		var entView = new EntityView(entityModel, false);

		if (entityModel == this.controlledEntity) {
			this.avatarNode = entView
		}

		this.entityViews.push(entView);
	}

	/*
	onBtnCloseSkills(e) {
		if(this.skillsView == null) {
			return;
		}
		this.topView.removeChild(this.skillsView, true);
		this.skillsView = null;

		var playerEntity = this.pModel.entities[0];
		this._rebuildAllAbilities(playerEntity);

		EventBus.game.dispatch({evtName:"intentGrindMode"});
	}

	onShowNoSkillsAlert(e) {
		if(this.noSkillsView == null) {
			this._hideStratView();

			this.noSkillsView = new NoSkillsAlertView();
			var screenSize = Graphics.ScreenSize;
			this.noSkillsView.pos.setVal(screenSize.x/2, screenSize.y/3);
			this.topView.addChild(this.noSkillsView);
		}
	}
	onHideNoSkillsAlert(e) {
		this._hideNoSkillsView();
	}
	_hideNoSkillsView()
	{
		if(this.noSkillsView != null) {
			this.noSkillsView.removeFromParent(true);
			this.noSkillsView = null;
		}
	}

	onBtnSkills(e) {
		EventBus.game.dispatch({evtName:"intentIdleMode"});

		this._hideStratView();
		this._hideNoSkillsView();

		this.skillsView = new SkillsConfigureView(this.pModel.playerModel);
		this.topView.addChild(this.skillsView);
	}

	onBtnCloseStrat(e){
		this._hideStratView();
	}

	onBtnStrat(e) {
		if(this.stratView != null) {
			this._hideStratView();
		}else {
			this._showStratView();
		}
	}
	_hideStratView() {
		if(this.stratView == null) {
			return;
		}
		this.topView.removeChild(this.stratView, true);
		this.stratView = null;
	}
	_showStratView() {
		if(this.stratView != null) {
			return;
		}

		this._hideNoSkillsView();

		this.stratView = new StratSelectionView(this.pModel.playerModel);
		var screenSize = Graphics.ScreenSize;
		this.stratView.pos.setVal(screenSize.x/2, screenSize.y/3);
		this.topView.addChild(this.stratView);
		//this.rootView.addChild(this.stratView);

	}

	onBtnMap(e) {
		//TODO: pause app and show map instead of changing states
		this.pModel.pause();
		this.mapView = new MapView(this.pModel.locationIdx);
		this.rootView.addChild(this.mapView);
	}
	onDismissMap() {
		this.rootView.removeChild(this.mapView, true);
		this.mapView = null;
		this.pModel.unpause();
	}

	onBtnRest(e) {
		EventBus.game.dispatch({evtName:"intentRest"});
	}
	onPlayerRest(e) {
		this.showRest(); 
		this._updateAllAbilities();
	}
	*/

	Destroy() {
		/*
		var playerEntity = this.pModel.gameSim.entities[0];
    playerEntity.removeListener("update", this.onPlayerModelUpdate.bind(this));
		playerEntity.removeListener("castEnd", this.onPlayerModelAttack.bind(this));
		*/

		this.pModel = null;
		super.Destroy();
	}
	
}

class ModeHudView extends NodeView {
	constructor( battleStateModel ) {
		super();

		this.pModel = battleStateModel;

		this.setRect(200,100, "rgba(0,0,0,0.5)");

		this.highlight = new NodeView();
		this.highlight.setRect(50,50, "#FFFFFF");
		this.addChild(this.highlight);

    var lblText = new NodeView();
    lblText.setLabel("Activity", "16px Arial", "#FFFFFF");
    lblText.pos.setVal(0, -35);
    this.addChild(lblText);

		this.btnGrind = new ButtonView("btnGrind", "gfx/items/icon_grind.sprite");
		this.btnGrind.pos.setVal(-50, 0);
		this.addChild(this.btnGrind);
		this.SetListener("btnGrind", this.onBtnGrind);

		this.btnStop = new ButtonView("btnStop","gfx/items/icon_stop.sprite");
		this.btnStop.pos.setVal(50, 0);
		this.addChild(this.btnStop);
		this.SetListener("btnStop", this.onBtnStop);

		//quest
		//dungeon

		this.SetListener("battleModeChanged", this.onBattleModeChanged, EventBus.game);
	}

	onBtnStop(e) {
		EventBus.game.dispatch({evtName:"intentIdleMode"});
	}

	onBtnGrind(e) {
		EventBus.game.dispatch({evtName:"intentGrindMode"});
	}

	onBattleModeChanged(e) {
		var mode = e.mode;
		switch(mode) {
			case BattleState.MODE_IDLE:
				this.highlight.pos.setVec(this.btnStop.pos);
			break;
			case BattleState.MODE_GRIND:
				this.highlight.pos.setVec(this.btnGrind.pos);
			break;
		}
	}
}

class StratSelectionView extends NodeView {
	constructor(playerModel) {
		super();
		this.playerModel = playerModel;

		this.setRect(400,200, "rgba(0,0,0,0.7)");

    var lblText = new NodeView();
    lblText.setLabel("Stratedgies", "16px Arial", "#FFFFFF");
    lblText.pos.setVal(0, -85);
    this.addChild(lblText);

    var btnClose = new ButtonView("btnCloseStrat", "gfx/ui/btn_white_sm.sprite", "X", "18px Arial", "#FF0000");
    btnClose.pos.setVal(185,-85);
    this.addChild(btnClose);

		//TODO: slider for health pct
		var lblRest = new NodeView();
		lblRest.setLabel("Rest", "10px Arial", "#FFFFFF");
    lblRest.pos.setVal(-150, -75);
    this.addChild(lblRest);
		this.pctRest = CreateSimpleVerticleSlider(50, 120, "setPctRest", EventBus.game);
		this.pctRest.pos.setVal(-150, 0);
		this.pctRest.pct = this.playerModel.getRestPct();
		this.addChild(this.pctRest);
		var lblRestVal = new NodeView();
		lblRestVal.setLabel( ~~(this.pctRest.pct * 100) + "%", "10px Arial", "#FFFFFF");
    lblRestVal.pos.setVal(-150, 85);
    this.addChild(lblRestVal);

		var pctRest = this.pctRest;
		this.SetListener("setPctRest", function(e) {
			lblRestVal.updateLabel( ~~(pctRest.pct * 100) + "%");
		}, EventBus.game);
		//TODO: slider for cooldown wait

		//TODO: toggle for pull count

		//TODO: checks for loot type
	}
}

class NoSkillsAlertView extends NodeView {
	constructor() {
		super();

		this.setRect(400,200, "rgba(0,0,0,0.7)");

		var lblTitle = new NodeView();
    lblTitle.setLabel("No Skills Equipped!", "16px Arial", "#FF0000");
    lblTitle.pos.setVal(0, -85);
    this.addChild(lblTitle);

		var lblText = new NodeView();
    lblText.setLabel("You need to unlock and equip a skill first!", "16px Arial", "#FFFFFF");
    lblText.pos.setVal(0, 5);
    this.addChild(lblText);

		var btnSkills = new ButtonView("btnSkills", "gfx/items/icon_book.sprite");
		btnSkills.pos.setVal(0, 50);
		this.addChild(btnSkills);

    var btnClose = new ButtonView("btnCloseNoSkillsAlert", "gfx/ui/btn_white_sm.sprite", "X", "18px Arial", "#FF0000");
    btnClose.pos.setVal(185,-85);
    this.addChild(btnClose);
	}
}
import { Application, Service, EventBus, Graphics, LoadingState } from './clientEZPZ.js'
import ClientProtocol from './networking/ClientProtocol.js'
import ConnectingState from './controller/ConnectingState.js'
import LocationState from './controller/LocationState.js'
import BattleState from './controller/BattleState.js'
import CharacterManagerState from './controller/CharacterManagerState.js'
import {ClientGameController} from './controller/ClientGameController.js'

var bShowDebug = false;

var game_create = function()
{
	var app = new Application("KinderQuest", "content");
	window.app = app;

	// Config
	Graphics.areSpritesCentered = true

	// Initialize networking protocol
	new ClientProtocol()
	var clientGame = ClientGameController.instance
	console.log("create client game " + clientGame.uuid)

	// Initialize global listeners
	EventBus.game.addListener("serverConnect", ()=>{
		Service.Get("state").gotoState("manager")
	})

	// Initialize app statemachine
	var stateController = Service.Get("state");
	stateController.addState("loading", LoadingState);
	stateController.addState("connecting", ConnectingState);
	stateController.addState("manager", CharacterManagerState);
	stateController.addState("location", LocationState);
	stateController.addState("battle", BattleState);
	
	var resources = [
			"gfx/ui/btn_blue.sprite",
			"gfx/ui/btn_dark.sprite",
			"gfx/ui/btn_white.sprite",
			"gfx/ui/btn_white_sm.sprite",
			"gfx/workbench3.png",
			"gfx/map.png",
			"gfx/bgs/bg_DragonSaddle.jpg",
			"gfx/bgs/bg_Exiled.jpg",
			"gfx/bgs/bg_GnollMesa.jpg",
			"gfx/bgs/bg_GreatPlains.jpg",
			"gfx/bgs/bg_Horns.jpg",
			"gfx/bgs/bg_Kaisa.jpg",
			"gfx/bgs/bg_Kastador.jpg",
			"gfx/bgs/bg_ManyRivers.jpg",
			"gfx/bgs/bg_Sarathis.jpg",
			"gfx/bgs/bg_SeaGuard.jpg",
			"gfx/bgs/bg_Talmony.jpg",
			"gfx/bgs/bg_Tower.jpg",
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
			"gfx/avatars/centaur_idle.sprite",
			"gfx/avatars/centaur_attack.sprite",
			"gfx/avatars/dwarf_idle.sprite",
			"gfx/avatars/dwarf_attack.sprite",
			"gfx/avatars/elf_idle.sprite",
			"gfx/avatars/elf_attack.sprite",
			"gfx/avatars/gnome_idle.sprite",
			"gfx/avatars/gnome_attack.sprite",
			"gfx/avatars/goblin_idle.sprite",
			"gfx/avatars/goblin_attack.sprite",
			"gfx/avatars/human_idle.sprite",
			"gfx/avatars/human_attack.sprite",
			"gfx/avatars/orc_idle.sprite",
			"gfx/avatars/orc_attack.sprite",
			"gfx/avatars/avatar.anim",
			"gfx/avatars/avatars.spb",
			"gfx/levels/test.json",
			"gfx/levels/test2.json",
			"gfx/levels/terrain.png"
			];
	stateController.gotoState("loading", [resources, "connecting"]); 
	
	app.Play();
}

document.game_create = game_create

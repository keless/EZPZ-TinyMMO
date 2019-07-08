import { AppState, BaseStateView, NodeView, Service, Vec2D } from '../clientEZPZ.js'
import PlayerModel from '../../../shared/model/PlayerModel.js'

export default class LocationState extends AppState {
	constructor(locationIdx) { 
		super();
		this.view = new LocationStateView(locationIdx);	
	}
}

class LocationStateView extends BaseStateView {
	constructor(locationIdx) {
		super();

		this.locationIdx = locationIdx;

		//update player location and save
		this.playerModel = PlayerModel.Get();
		this.playerModel.locationIdx = locationIdx;

		// save player state once locations are reached
		this.playerModel.save();

		var screenSize = Graphics.ScreenSize;

		var location = g_locations[locationIdx];

		var imgBg = new NodeView();
		imgBg.setImageStretch(location.img, 0,0, screenSize.x, screenSize.y);
		this.rootView.addChild(imgBg);

		var lblText = new NodeView();
		lblText.setRect(500, 40, "rgba(1,1,1,0.4)")
		lblText.setLabel(location.name, "20px Arial", "#FFFFFF");
		lblText.pos.setVal(screenSize.x/2, 50);
		this.rootView.addChild(lblText);
		
		var navStartX = 150;

    //store
		this.storeView = null;
		this._addButton("btnStore", "Store", navStartX, 150);
		this.SetListener("btnStore", this.onBtnStore);
    //bank
		this.bankView = null;
		this._addButton("btnBank", "Bank", navStartX, 250);
		this.SetListener("btnBank", this.onBtnBank);
    //rune crafting
		this._addButton("btnCraft", "Craft", navStartX, 350);
		this.SetListener("btnCraft", this.onBtnCraft);
    //look for trouble
		this._addButton("btnGrind", "Grind", navStartX, 450);
		this.SetListener("btnGrind", function(e){ 
			Service.Get("state").gotoState("battle", locationIdx);
		});
    //map
		this._addButton("btnMap", "Map", navStartX, 550);
		this.SetListener("btnMap", this.onBtnMap);
		this.SetListener("btnDismissMap", this.onDismissMap);
		this.SetListener("btnMapLoc", this.onBtnMapLoc);
		//talents
		this.skillsView = null;
		this._addButton("btnSkills", "Skills & Abilities", navStartX, 650);
		this.SetListener("btnCloseSkills", this.onBtnCloseSkills);
		this.SetListener("btnSkills", this.onBtnOpenSkills);
		//logout
		this._addButton("btnQuit", "Quit", navStartX, 750);
		this.SetListener("btnQuit", function(e){ 
			Service.Get("state").gotoState("manager");
		});

		this.inventoryHud = new InventoryHudView(this.playerModel);
		this.inventoryHud.pos.setVal(screenSize.x - this.inventoryHud.size.x/2, 425);
		this.rootView.addChild(this.inventoryHud);

		this.playerHud = new PlayerHudView(this.playerModel.getEntity());
		this.playerHud.pos.setVal(screenSize.x - this.playerHud.size.x/2, 652);
		this.rootView.addChild(this.playerHud);

		this.SetListener("btnBankSlot", this.onBtnBankSlot);
		this.SetListener("btnEquipSlot", this.onBtnEquipSlot);
		this.SetListener("btnInvSlot", this.onBtnInvSlot);

		this.SetListener("btnCloseStore", this.onBtnCloseStore);
		this.SetListener("btnCloseBank", this.onBtnCloseBank);
		this.SetListener("btnCloseCraft", this.onBtnCloseCraft);
  }

	onBtnBankSlot(e) {
		var slotIdx = e.idx;
		var pageIdx = e.page;
		var inv = this.playerModel.getInventory();

		//if player has item in slotIdx
		if(!inv.hasCapacity(1)) return;

		//attempt to move item from bank to inventory
		var itemModel = this.playerModel.takeFromBank(pageIdx, slotIdx);
		if(!itemModel) return;

		inv.addItem(itemModel);

		this.playerModel.save();
		EventBus.ui.dispatch({evtName:"bankChanged"});
		EventBus.ui.dispatch({evtName:"playerInvChanged"});
	}

	onBtnEquipSlot(e) {
		var slotIdx = e.idx;
		var inv = this.playerModel.getInventory();

		if(this.storeView != null) {
			//try to sell to store
			var itemModel = this.playerModel.getEquipItem(slotIdx);
			EventBus.ui.dispatch({evtName:"playerSellIntent", isInvItem:false, slotIdx:slotIdx, itemModel:itemModel});

		}else {
			if(this.playerModel.attemptUnequipToInv(slotIdx)) {
				this.playerModel.save();
			}
		}
	}

	onBtnInvSlot(e) {
		var slotIdx = e.idx;
		var inv = this.playerModel.getInventory();
		if(this.storeView != null) {
			//try to sell to store
			var itemModel = inv.getItem(slotIdx);
			EventBus.ui.dispatch({evtName:"playerSellIntent", isInvItem:true, slotIdx:slotIdx, itemModel:itemModel});

		}else if(this.bankView != null) {
			//try to send to bank
			if(this.playerModel.hasBankCapacity(1)) {
				var itemModel = inv.takeItem(slotIdx);
				if(itemModel) {
					this.playerModel.putInBank(itemModel);

					this.playerModel.save();
					EventBus.ui.dispatch({evtName:"bankChanged"});
					EventBus.ui.dispatch({evtName:"playerInvChanged"});
				}
			}
		}else {
			if(this.playerModel.attemptEquipFromInvSlot(slotIdx)) {
				this.playerModel.save();
			}
		}
	}

	onBtnStore(e) {
		if(this.storeView == null) {
			this._closeBankView();
			this._closeCraftView();
			this._openStoreView();
		}else {
			this._closeStoreView();
		}
	}

	onBtnBank(e) {
		if(this.bankView == null) {
			this._closeStoreView();
			this._closeCraftView();
			this._openBankView();
		} else {
			this._closeBankView();
		}
	}

	onBtnCraft(e) {
		if(this.craftView == null) {
			this._closeStoreView();
			this._closeBankView();
			this._openCraftView();
		} else {
			this._closeCraftView();
		}
	}

	_openBankView() {
		if(this.bankView == null) {
			this.bankView = new BankView(this.playerModel);
			this.bankView.pos.setVal(400, 325);
			this.rootView.addChild(this.bankView);
		}
	}
	_closeBankView() {
		if(this.bankView != null) {
			this.rootView.removeChild(this.bankView, true);
			this.bankView = null;
		}
	}
	_openStoreView() {
		if(this.storeView == null) {
			this.storeView = new StoreView();
			this.storeView.pos.setVal(400, 325);
			this.rootView.addChild(this.storeView);
		}
	}
	_closeStoreView() {
		if(this.storeView != null) {
			this.rootView.removeChild(this.storeView, true);
			this.storeView = null;
		}
	}
	_openCraftView() {
		if(this.craftView == null) {
			this.craftView = new CraftView();
			this.craftView.pos.setVal(400, 325);
			this.rootView.addChild(this.craftView);
		}
	}
	_closeCraftView() {
		if(this.craftView != null) {
			this.rootView.removeChild(this.craftView, true);
			this.craftView = null;
		}
	}

	onBtnMap(e) {
		//TODO: pause app and show map instead of changing states
		this.mapView = new MapView(this.locationIdx);
		this.rootView.addChild(this.mapView);
	}

	onBtnMapLoc(e) {
		this.onDismissMap(null);
		//TODO: traveling animation
		Service.Get("state").gotoState("location", e.idx);
	}
	
	onDismissMap(e) {
		this.rootView.removeChild(this.mapView, true);
		this.mapView = null;
	}

	onBtnCloseStore(e) {
		this._closeStoreView();
	}
	onBtnCloseBank(e) {
		this._closeBankView();
	}
	onBtnCloseCraft(e) {
		this._closeCraftView();
	}

	onBtnOpenSkills(e) {
		this.skillsView = new SkillsConfigureView(this.playerModel);
		this.rootView.addChild(this.skillsView);
	}
	onBtnCloseSkills(e) {
		this.rootView.removeChild(this.skillsView);
		this.skillsView = null;
	}

}

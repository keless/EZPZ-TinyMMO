"use strict"; //ES6

class PlayerModel {
  static get BANK_PAGE_SLOTS() { return 9; }

  static get EQUIP_MAIN() { return 0; }
  static get EQUIP_ARMOR() { return 1; }
  static get EQUIP_OFF() { return 2; }

	constructor( saveId ) {
    this.ghostPeriod = 3; //in seconds
    this.restPeriod = 4; //in seconds
    this.returnPeriod = 3; //in seconds

    // non-serialized properties
    this._isResting = false;
    this.restTime = 0;

		// serialized properties
    this.entity = new EntityModel();
    this.saveId = saveId;
    this.locationIdx = 0;

    this.bankPages = 1;
    this.bankItems = [];

    this.craftingLevel = 0;

    this.skills = new SkillsModel(this);

    this.equipment = [null, null, null];

    this.stratRestHealth = 0.3; //30%
	}

  initWithJson(json) {
    this.entity.initWithJson( json["entity"] || {} );
    this.locationIdx = json["locIdx"] || 0;
    this.stratRestHealth = json["stratRestHealth"] || 0.3;

    this.craftingLevel = json["craftingLevel"] || 0;
    
    this.skills.initWithJson( json["skills"] || {} );

    this.bankPages = json["bankPages"] || 1;
    this.bankItems = [];
    if(json["bank"]) {
      for(var i=0; i < json["bank"].length ; i++) {
        var itemJson = json["bank"][i];
        var itemModel = new ItemModel();
        itemModel.initWithJson(itemJson);
        this.bankItems.push(itemModel);
      }
    }
    
    this.equipment = [null, null, null];
    if(json["equipment"]) {
      for(var i=0; i < this.equipment.length ; i++) {
        var itemJson = json["equipment"][i];
        if(!itemJson) continue;
        var itemModel = new ItemModel();
        itemModel.initWithJson(itemJson);
        //this.equipment[i] = itemModel;
        this.equipItem(itemModel);
      }
    }

    this.skills.applyToEntity(this.entity);
  }

  toJson() {
    var bank = [];
    for(var i=0; i < this.bankItems.length ; i++) {
      var item = this.bankItems[i];
      bank.push(item.toJson());
    }

    var equip = [];
    for(var i=0; i < this.equipment.length ; i++) {
      var item = this.equipment[i];
      if(!item) continue;
      equip.push(item.toJson());
    }

    var json = { 
      entity:this.entity.toJson(), 
      locIdx:this.locationIdx,
      stratRestHealth:this.stratRestHealth,
      craftingLevel:this.craftingLevel,
      skills:this.skills.toJson(),
      equipment:equip,
      bankPages:this.bankPages,
      bank:bank
    };
    return json;
  }

  save() {
    var sd = Service.Get("sd");
    sd.save(this.saveId, this.toJson());
  }

  //ISkillsModelDelegate
  getSkillTrees() {
    return [ this.entity.race, this.entity.class ]
  }

  //ISkillsModelDelegate
  getPoints() {
    return this.entity.xp_level;
  }

  //ISkillsModelDelegate
  getXpLevel() {
    return this.entity.xp_level;
  }

  getSkillsModel() {
    return this.skills;
  }

  incCraftingLevel() {
    this.craftingLevel++;
  }

  setRestPct(pct) {
    pct = Math.max(Math.min(pct, 1), 0); //cap between 0 and 1
    this.stratRestHealth = pct;
  }

  getRestPct() {
    return this.stratRestHealth;
  }

  shouldRest() {
    var ent = this.entity;
    return ((ent.hp_curr / ent.hp_base) < this.stratRestHealth) && !this.isGhost();
  }

  isGhost() {
    return this.entity.isDead;
  }

  shouldRespawn(ct) {
    if(ct > this.entity.deadTime + this.ghostPeriod) {
      return true;
    }
    return false;
  }

  getEntity() {
    return this.entity;
  }

  getGoldFindModifier() {
    return this.entity.getPassiveGoldFindModifier();
  }

  getBarterModifier() {
    return this.entity.getPassiveBarterModifier();
  }

  respawn() {
    console.log("player respawn!");
    this.entity.isDead = false;
    this.entity.healFull();
  }

  stopAllCasting() {
    this.entity.stopAllCasting();
  }

  restStart(ct) {
    this.stopAllCasting();
    this._isResting = true;
    this.restTime = ct;
  }

  isResting() {
    return this._isResting;
  }

  shouldFinishResting(ct) {
    if(ct > this.restTime + this.restPeriod) {
      return true;
    }
    return false;
  }

  restEnd() {
    this._isResting = false;
    this.entity.hp_curr = this.entity.hp_base;
  }

  gainXP( xp ) {
    this.entity.incProperty("xp_curr", xp);
  }

  incGold( coins ) {
    this.entity.inventory.incGold(coins);
    EventBus.ui.dispatch({evtName:"playerGoldChanged"});
  }

  getGold() { 
    console.log("get gold from " + this.entity.inventory);
    return this.entity.inventory.getGold();
  }
  getInventory() {
    return this.entity.inventory;
  }
  addItemType(itemId, stackSize) {
    stackSize = stackSize || 1;
    var item = ItemModel.Get(itemId);
    this.getInventory().addItem(item);
    EventBus.ui.dispatch({evtName:"playerInvChanged"});
  }
  addItem(itemModel) {
    this.getInventory().addItem(itemModel);
    EventBus.ui.dispatch({evtName:"playerInvChanged"});
  }
  takeItem(idx) {
    var itemModel = this.getInventory().takeItem(idx);
    EventBus.ui.dispatch({evtName:"playerInvChanged"});
    return itemModel;
  }

  /**
   * try to purchase item
   * 
   * return false if failed (not enough money, space)
   * return true and subtract price and add item if success
   */
  attemptPurchase(itemId) {
    var currGold = this.getGold();
    var price = ItemModel.GetPrice(itemId, 1);
    if(currGold < price) return false;
    
    var itemModel = ItemModel.Get(itemId);
    var inv = this.getInventory();
    if(!inv.hasCapacityForItem(itemModel)) return false;

    if(itemModel.isStackable()) {
      itemModel.currStacks = 1;
    }

    price = ~~(price * (1.0 - this.getBarterModifier()));
    price = Math.max(price, 1);

    this.addItem(itemModel);
    this.incGold(-1 * price);
  }

  getBankCapacity() {
    return PlayerModel.BANK_PAGE_SLOTS * this.bankPages;
  }

  hasBankCapacity(qty) {
    console.log("bank has " + this.bankItems.length + " of " + this.getBankCapacity())
    return (this.bankItems.length + qty <= this.getBankCapacity());
  }

  /**
   *  places item into bank if possible (return true if success, false if fail)
   */
  putInBank(itemModel) {
    if(this.bankItems.length + 1 > this.getBankCapacity()) {
      return false; //bank full
    }

    this.bankItems.push(itemModel);
    return true;
  }

  /**
   * remove item from bank slot at idx and return it
   */
  takeFromBank(pageIdx, idx) {
    idx = idx + pageIdx * PlayerModel.BANK_PAGE_SLOTS;
    if( idx >= this.bankItems.length ) return null;

    var item = this.bankItems[idx];
    this.bankItems.splice(idx, 1);
    return item;
  }

  /**
   * given the index of an equiped item,
   *   try to unequip that item and place it in inv
   * sends events if equip/inventory changed
   * return true if success, false if failure
   */
  attemptUnequipToInv(slotIdx) {
    var inv = this.getInventory();
    if(inv.hasCapacity(1)) {
      var itemModel = this.unequipItem(slotIdx);
      if(itemModel) {
        inv.addItem(itemModel);
        EventBus.ui.dispatch({evtName:"playerInvChanged"});
        return true;
      }
    }
    return false;
  }

  /**
   * given the index of an item in inventory, 
   *   try to equip that item in an empty slot
   *   or swap it with an equipped item
   * sends events if equip/inventory changed
   * return true if success, false if failure
   */
  attemptEquipFromInvSlot( slotIdx ) {
    var inv = this.getInventory();
    var peekItem = inv.getItem(slotIdx);
    if(!peekItem) {
      //no item in that slot
      return false;
    }
    if(this.canEquipItem(peekItem)) {
      var itemModel = inv.takeItem(slotIdx);
      if(itemModel) {
        if(this.equipItem(itemModel)) {
          EventBus.ui.dispatch({evtName:"playerInvChanged"});
          return true;
        }else {
          console.warn("equipItem failed after canEquipItem was true");
          inv.addItem(itemModel); //failed for some reason, put item back!
        }
      }
    }else if(this.canSwapEquipItem(peekItem)) {
      //swap with currently equipped item
      var itemModel = inv.takeItem(slotIdx);
      if(itemModel) {
        if(this.swapEquipItem(itemModel)) {
          return true;
        }else {
          console.warn("swapEquipItem failed after canSwapEquipItem was true");
          inv.addItem(itemModel); //failed for some reason, put item back!
        }
      }
    }
    return false;
  }

  /**
   * return item from bank slot without removing it
   */
  getBankItem(pageIdx, idx) {
    idx = idx + pageIdx * PlayerModel.BANK_PAGE_SLOTS;
    if( idx >= this.bankItems.length ) return null;
    return this.bankItems[idx];
  }

  /**
   * check if an item can be equipped
   */
  canEquipItem( itemModel ) {
    if(!itemModel) return false;
    switch(itemModel.type) {
      case ItemType.MAINHAND:
        if(this.equipment[PlayerModel.EQUIP_MAIN] == null) {
          return true;
        }else {
          return false;
        }
      case ItemType.ARMOR:
        if(this.equipment[PlayerModel.EQUIP_ARMOR] == null) {
          return true;
        }else {
          return false;
        }
      case ItemType.OFFHAND:
       //can equip if empty and main hand is not a two hander
        if(this.equipment[PlayerModel.EQUIP_OFF] == null 
        && (this.equipItem[PlayerModel.EQUIP_MAIN] == null || this.equipItem[PlayerModel.EQUIP_MAIN].type != ItemType.TWOHANDED)
        ) {
          return true;
        }else {
          return false;
        }
      case ItemType.TWOHANDED:
        //can equip if main and off are empty
        if(this.equipment[PlayerModel.EQUIP_MAIN] == null 
         && this.equipment[PlayerModel.EQUIP_OFF] == null) {
          return true;
        }else {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * equip item if possible
   */
  equipItem(itemModel) {
    if(!itemModel) return false;
    if(!this.canEquipItem(itemModel)) return false;

    var success = false;
    switch(itemModel.type) {
      case ItemType.MAINHAND:
      case ItemType.TWOHANDED:
        console.log("equip item in main hand slot");
        this.equipment[PlayerModel.EQUIP_MAIN] = itemModel;
      	success = true;
      break;
      case ItemType.ARMOR:
        console.log("equip item in armor slot");
        this.equipment[PlayerModel.EQUIP_ARMOR] = itemModel;
      	success = true;
      break;
      case ItemType.OFFHAND:
        console.log("equip item in off hand slot");
        this.equipment[PlayerModel.EQUIP_OFF] = itemModel;
      	success = true;
      break;
    }

    if(success) {
      this._applyEquipStatBuff(itemModel);
      EventBus.ui.dispatch({evtName:"playerEquipChanged"});
    }

    return success;
  }

  _applyEquipStatBuff(itemModel) {
    if(!itemModel) return;
    var itemStats = g_items[itemModel.itemId].stats;
    for(var key in itemStats) {
      this.entity.incProperty(key, itemStats[key], null);
    }
    EventBus.ui.dispatch({evtName:"playerStatsChanged"});
  }
  _removeEquipStatBuff(itemModel) {
    if(!itemModel) return;
    var itemStats = g_items[itemModel.itemId].stats;
    for(var key in itemStats) {
      this.entity.incProperty(key, -1 * itemStats[key], null);
    }
    EventBus.ui.dispatch({evtName:"playerStatsChanged"});
  }

  //assumes you've already tested canEquipItem first
  canSwapEquipItem( itemModel ) {
    if(!itemModel) return false;
    switch(itemModel.type) {
      case ItemType.MAINHAND:
        //mainhand can swap with a mainhand or twohander
        return true;
      case ItemType.ARMOR:
        //armor can swap with armor
        return true;
      case ItemType.OFFHAND:
        //offhand can swap with an offhand
        //offhand can swap with twohander
       return true;
      case ItemType.TWOHANDED:
        if(this.equipment[PlayerModel.EQUIP_OFF] == null) {
          //twohander can swap with a twohander
          //twohander can swap with a mainhand + no offhand
          return true;
        }else if(this.getInventory().hasCapacity(1)) {
          //twohander can swap with a mainhand + offhand ONLY
          //  if there is an extra inventory capacity open
          return true;
        }else {
          return false;
        }
      default:
        return false;
    }
  }

  swapEquipItem( itemModel ) {
    if(!itemModel) return false;
    if(!this.canSwapEquipItem(itemModel)) return false;

    var success = false;
    switch(itemModel.type) {
      case ItemType.MAINHAND:
        //mainhand can swap with a mainhand or twohander
        var ue1 = this.unequipItem(PlayerModel.EQUIP_MAIN);
        this.equipItem(itemModel);
        this.addItem(ue1);
        success = true;
      break;
      case ItemType.ARMOR:
        //armor can swap with armor
        var ue1 = this.unequipItem(PlayerModel.EQUIP_ARMOR);
        this.equipItem(itemModel);
        this.addItem(ue1);
        success = true;
      break;
      case ItemType.OFFHAND:
        //offhand can swap with an offhand
        //offhand can swap with twohander
        var ue1 = this.unequipItem(PlayerModel.EQUIP_OFF);
        if(!ue1) {
          ue1 = this.unequipItem(PlayerModel.EQUIP_MAIN);
        }
        this.equipItem(itemModel);
        this.addItem(ue1);
        success = true;
      break;
      case ItemType.TWOHANDED:
        if(this.equipment[PlayerModel.EQUIP_OFF] == null) {
          //twohander can swap with a twohander
          //twohander can swap with a mainhand + no offhan        
          var ue1 = this.unequipItem(PlayerModel.EQUIP_MAIN);
          this.equipItem(itemModel);
          this.addItem(ue1);
          success = true;
        }else if(this.getInventory().hasCapacity(2)) {
          //twohander can swap with a mainhand + offhand ONLY
          //  if there is an extra inventory capacity open
          var ue1 = this.unequipItem(PlayerModel.EQUIP_MAIN);
          var ue2 = this.unequipItem(PlayerModel.EQUIP_OFF);
          this.equipItem(itemModel);
          this.addItem(ue1);
          this.addItem(ue2);
          success = true;
        }
      break;
    }

    if(success) {
      EventBus.ui.dispatch({evtName:"playerEquipChanged"});
      EventBus.ui.dispatch({evtName:"playerInvChanged"});
    }

    return success;
  }

  // return item at equipment index without removing it
  getEquipItem(idx) {
    if(idx >= this.equipment.length) return null;
    return this.equipment[idx];
  }

  // return item at equipment index after removing it
  unequipItem(idx) {
    if(idx >= this.equipment.length) return null;
    if(!this.equipment[idx]) return null;
    var itemModel = this.equipment[idx];
    this.equipment[idx] = null;
    this._removeEquipStatBuff(itemModel);
    EventBus.ui.dispatch({evtName:"playerEquipChanged"});
    return itemModel;
  }


  static Get() {
    return PlayerModel.s_instance;
  }

  static Load(saveId) {
    var sd = Service.Get("sd");
    PlayerModel.s_instance = new PlayerModel(saveId);
    PlayerModel.s_instance.initWithJson(sd.load(saveId));
  }
}
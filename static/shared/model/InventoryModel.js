"use strict"; //ES6

class InventoryModel {
	constructor( ) {

    this.items = [];

    this.capacity = 4;
    this.gold = 0;
	}

  initWithJson(json) {
    this.gold = json["gold"] || 0;
    console.log("init inv gold is " + this.gold);
    this.capacity = json["capacity"] || 4;
    var items = json["items"] || [];
    for(var i=0;i<items.length;i++) {
      var item = new ItemModel();
      item.initWithJson(items[i]);
      this.items.push(item);
    }
  }

  toJson() {
    var itms = [];
    for(var i=0; i < this.items.length; i++) {
      itms.push( this.items[i].toJson());
    }

    var json = { 
        capacity:this.capacity, 
        gold:this.gold,
        items:itms
      };
    return json;
  }

  incGold( coins ) {
    this.gold += coins;
  }

  getGold() {
    return this.gold;
  }

  addCapacity() {
    this.capacity++;
  }
  getCapacity() {
    return this.capacity;
  }

  getNumItems() {
    return this.items.length;
  }

  hasCapacity( numItems ) {
    return this.capacity >= (this.items.length + numItems);
  }

  hasCapacityForItem( itemModel, partialStackOkay ) {
    partialStackOkay = partialStackOkay || false;
    if(this.hasCapacity(1)) {
      return true;
    } else if(itemModel.isStackable()) {
      //TODO: auto fill stacks

      //see if item is stackable and there is a stack ready
      for(var i=0;i < this.items.length; i++) {
        if(this.items[i].itemId == itemModel.itemId) {
          var invStack = this.items[i];
          if(invStack.currStacks == invStack.maxStacks) {
            continue; //this stack is full, try a diff one
          }

          if(partialStackOkay) return true;

          if(invStack.currStacks + itemModel.currStacks < invStack.maxStacks) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * add an item to the inventory if possible
   * 
   * if adding stackable item, will place on top of existing 
   * stack if there is room, or new stack otherwise
   * 
   * return true if successful
   * return false if failed
   */
  addItem( itemModel ) {
    if(!itemModel) return false;

      // ie: 'hasCapacityFor(item)' partial or full??
    if(!this.hasCapacityForItem(itemModel)) {
      return false; //cant add
    }

    if(itemModel.isStackable()) {
      //try to stack
      for(var i=0;i < this.items.length; i++) {
        if(this.items[i].itemId == itemModel.itemId) {
          var invStack = this.items[i];
          if(invStack.currStacks == invStack.maxStacks) {
            continue; //this stack is full, try a diff one
          }

          //TODO handle splitting stacks?

          invStack.currStacks += itemModel.currStacks;
          invStack.currStacks = Math.min(invStack.currStacks, invStack.maxStacks);

          return true; //stacked
        }
      }
    }

    this.items.push(itemModel);
    return true;
  }

  // remove item and return it as output
  // returns null if fail
  takeItem( idx ) {
    if(idx >= this.items.length) return null;

    var item = this.items[idx];
    this.items.splice(idx, 1);
    return item;
  }

  // return item as output without removing it
  // returns null if fail
  getItem( idx ) {
    if(idx >= this.items.length) return null;
    return this.items[idx];
  }

  getQtyForItemType( itemId ) {
    var qty = 0;
    for(var i=0;i < this.items.length; i++) {
      if(this.items[i].itemId == itemId) {
        qty += Math.max(this.items[i].currStacks, 1);
      }
    }
    return qty;
  }

  //caller is responsible for enquring there is enough qty
  //  use getQtyForItemType before calling this
  consumeQtyForItemType( itemId, qty ) {
    var itemsToRemove = [];

    for(var i=(this.items.length-1); (i >= 0) && (qty > 0); i--) {
      if(this.items[i].itemId == itemId) {
        var stack = Math.max(this.items[i].currStacks, 1);
        var delta = Math.min(stack, qty);

        
        stack -= delta;
        qty -= delta;

        this.items[i].currStacks = stack;

        if(stack <= 0) {
          this.items.splice(i, 1); //remove item
        }
      }

      if(qty != 0) {
        console.warn("consumeQtyForItemType still needs " + qty + " of " + itemId);
      }
    }
  }
}

class ItemModel {
  static Get(itemId) {
    var itemModel = new ItemModel(itemId);
    if(itemId) {
      itemModel.initWithJson(g_items[itemId]);
    }
    return itemModel;
  }

  static GetPrice(itemId, qty) {
    qty = qty || 1;
    return g_items[itemId].gold * qty;
  }

  constructor(itemId) {
    this.itemId = itemId || "(no id)";
    this.type = ItemType.TRASH;
    this.maxStacks = 1;
    this.currStacks = 0;
  }

  initWithJson(json) {
    this.itemId = json.itemId || this.itemId;
    this.type = json.type || ItemType.TRASH;
    this.currStacks = json.currStacks || 0;

    var itemTemplate = g_items[this.itemId];
    this.maxStacks = itemTemplate.maxStacks || 1;
    this.currStacks = Math.min(this.currStacks, this.maxStacks);
  }

  isStackable() {
    return this.maxStacks > 1;
  }

  getPrice() {
    return ItemModel.GetPrice(this.itemId, this.currStacks);
  }

  //TODO: replace this with sprites
  getHackColor() {
    return g_items[this.itemId]["hackColor"] || "#FF00FF";
  }

  toJson() {
    var json = {
      itemId:this.itemId,
      type:this.type,
      currStacks:this.currStacks
    };
    return json;
  }

  isEquipable() {
    if(this.equipSlot == ItemType.CRAFT || this.equipSlot == ItemType.TRASH) return false;
    return true;
  }
}
import _ from './clientEZPZ.js'

export default class CraftView extends NodeView {
  constructor() {
    super();

    this.playerModel = PlayerModel.Get();

    this.setRect(300,400, "rgba(0,0,0,0.5)");
            
    var lblText = new NodeView();
    lblText.setLabel("Crafting", "14px Arial", "#FFFFFF");
    lblText.pos.y = -85;
    this.addChild(lblText);

    var btnClose = new ButtonView("btnCloseCraft", "gfx/ui/btn_white_sm.sprite", "X", "18px Arial", "#FF0000");
    btnClose.pos.setVal(135,-185);
    this.addChild(btnClose);

    this.craftOptions = new NodeView();
    this.addChild(this.craftOptions);

    this.showCraftingOptionsForLevel( this.playerModel.craftingLevel + 1 );

    this.SetListener("btnCraftItem", this.onBtnCraftItem);
  }

  showCraftingOptionsForLevel(lvl) {
    this.craftOptions.removeAllChildren(true);

    var categoryLevel = Math.ceil(lvl / 10);
    
    var clothId = "mat_cloth_" + categoryLevel;
    
    var clothView = new ItemView( ItemModel.Get(clothId) );
    clothView.pos.setVal(-30, -60);
    clothView.setClick(function(){
      EventBus.ui.dispatch({evtName:"btnCraftItem", itemId:clothId, qty:lvl});
    });
    this.craftOptions.addChild(clothView);
    var lbl1 = new NodeView();
    lbl1.setLabel("x" + lvl.toString(), "10px Arial", "#FFFFFF");
    lbl1.pos.setVal(20, -60);
    this.craftOptions.addChild(lbl1);

    var leatherId = "mat_leather_" + categoryLevel;
    var leatherView = new ItemView( ItemModel.Get(leatherId) );
    leatherView.pos.setVal(-30, 0);
    leatherView.setClick(function(){
      EventBus.ui.dispatch({evtName:"btnCraftItem", itemId:leatherId, qty:lvl});
    });
    this.craftOptions.addChild(leatherView);
    var lbl2 = new NodeView();
    lbl2.setLabel("x" + lvl.toString(), "10px Arial", "#FFFFFF");
    lbl2.pos.setVal(20, 0);
    this.craftOptions.addChild(lbl2);

    var metalId = "mat_metal_" + categoryLevel;
    var metalView = new ItemView( ItemModel.Get(metalId) );
    metalView.pos.setVal(-30, 60);
    metalView.setClick(function(){
      EventBus.ui.dispatch({evtName:"btnCraftItem", itemId:metalId, qty:lvl});
    });
    this.craftOptions.addChild(metalView);
    var lbl3 = new NodeView();
    lbl3.setLabel("x" + lvl.toString(), "10px Arial", "#FFFFFF");
    lbl3.pos.setVal(20, 60);
    this.craftOptions.addChild(lbl3);
  }

  onBtnCraftItem(e) {
    var itemId = e.itemId;
    var qty = e.qty;
    var lvl = e.qty;
    var categoryLevel = Math.ceil(lvl / 10);

    var inv = this.playerModel.getInventory();

    //check if player has free slot
    if(!inv.hasCapacity(1)) {
      //player does not have enough space for item to be crafted
      return;
    }

    //check if player has neccesary items
    var hasQty = inv.getQtyForItemType( itemId );
    if( hasQty < qty ) {
      //player doesnt have enough of item to craft
      return;
    }

    //consume mats and create item
    inv.consumeQtyForItemType(itemId, qty);

    var createId = "arm_";
    if(itemId.includes("mat_cloth")) {
      createId += "cloth_";
    }else if( itemId.includes("mat_leather")) {
      createId += "leather_";
    }else if( itemId.includes("mat_metal")){
      createId += "metal_";
    }else {
      console.error("what am I supposed to craft here?!");
    }

    createId += categoryLevel.toString();

    var createdItem = ItemModel.Get(createId);
    inv.addItem(createdItem);

    this.playerModel.incCraftingLevel();
    this.playerModel.save();

    this.showCraftingOptionsForLevel( this.playerModel.craftingLevel + 1 );

    EventBus.ui.dispatch({evtName:"playerInvChanged"});
  }
}
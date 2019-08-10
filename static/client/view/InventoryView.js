import { NodeView, EventBus } from '../clientEZPZ.js'

// in-depth inventory "open" dialog
export default class InventoryView extends NodeView {
	constructor( model ) {
		super();
  }
}

// short view inventory 'closed' hud
export class InventoryHudView extends NodeView {
	constructor( model ) {
		super();

    this.playerModel = model;
    this.currBankPage = 0;

    this.setRect(200,350, "rgba(0,0,0,0.5)");

    var lblText = new NodeView();
    lblText.setLabel("Equipment", "16px Arial", "#FFFFFF");
    lblText.pos.setVal(0, -130);
    this.addChild(lblText);

    //equiped items
    this.equipSlots = [];
    for(var i=0; i < 3; i++) {
      var eqpSlot = new NodeView();
      eqpSlot.setRect(45,45, "rgba(0,0,0,1)");
      eqpSlot.pos.setVal(-50 + i*50, -80);
      (function(i2) { //stupid javascript :P
        eqpSlot.setClick(function(){
          EventBus.ui.dispatch({evtName:"btnEquipSlot", idx:i2});
        });
      })(i); //pass 'i' into separate scope
      this.addChild(eqpSlot);
      this.equipSlots.push(eqpSlot);
    }

    this.invSlots = [];
    var numSlots = this.playerModel.entity.inventory.getCapacity();
    var cols = 4;
    var invStartX = -75 + 1;
    var invStartY = 0;
    for(var i=0; i < numSlots; i++) {
      var row = ~~(i/cols);
      var invSlot = new NodeView();
      invSlot.setRect(45,45, "rgba(0,0,0,1)");
      var col = i % cols;
      invSlot.pos.setVal(invStartX + col*50, invStartY + row*50);
      (function(i2) { //stupid javascript :P
        invSlot.setClick(function(){
          EventBus.ui.dispatch({evtName:"btnInvSlot", idx:i2});
        });
      })(i); //pass 'i' into separate scope
      this.addChild(invSlot);
      this.invSlots.push(invSlot);
    }

    //money
    this.lblMoney = new NodeView();
    this.lblMoney.setLabel("0p 100g 50s 90c", "12px Arial", "#FFFFFF");
    this.lblMoney.pos.setVal(0, 130);
    this.addChild(this.lblMoney);

    this.updateMoney();
    this.updateInventory();
    this.updateEquips();

    this.SetListener("playerGoldChanged", this.onPlayerGoldChanged);
    this.SetListener("playerInvChanged", this.onPlayerInvChanged);
    this.SetListener("playerEquipChanged", this.onPlayerEquipChanged);
    
  }

  onPlayerGoldChanged(e) {
    this.updateMoney();
  }

  updateMoney() {
    var money = formatMoneyString( this.playerModel.getGold() );
    this.lblMoney.updateLabel(money);
  }

  onPlayerInvChanged(e) {
    this.updateInventory();
  }
  onPlayerEquipChanged(e) {
    this.updateEquips();
  }

  updateEquips() {
    for(var i=0;i<this.equipSlots.length; i++) {
      var equipSlot = this.equipSlots[i];
      equipSlot.removeAllChildren(true);

      var itemModel = this.playerModel.getEquipItem(i);
      if(itemModel) {
        var itemView = new ItemView(itemModel);
        equipSlot.addChild(itemView);
      }
    }
  }
  updateInventory() {
    for(var i=0;i<this.invSlots.length; i++) {
      var invSlot = this.invSlots[i];
      invSlot.removeAllChildren(true);

      if(i < this.playerModel.getInventory().getNumItems()) {
        var itemModel = this.playerModel.entity.inventory.items[i];
        var itemView = new ItemView(itemModel);
        invSlot.addChild(itemView);
      }
    }
  }
}

class ItemView extends NodeView {
	constructor( itemModel ) {
		super();

    this.itemModel = itemModel;
    this.stackView = null;

    var itemJson = g_items[itemModel.itemId];
    if("sprite" in itemJson) {
      var spr = itemJson.sprite;
      var frm = itemJson.sprIdx || 0;
      this.setSprite(spr, frm);
    }else if( "img" in itemJson) {
      var img = g_items[itemModel.itemId].img;
      this.setImage(img);
    }else {
      var hackColor = itemModel.getHackColor();
      this.setRect(40,40, hackColor);
    }

    this.updateStacks();
  }

  updateStacks() {
    if(this.itemModel.currStacks > 1) {
      if(!this.stackView) {
        this.stackView = new NodeView();
        this.stackView.setLabelWithOutline(this.itemModel.currStacks.toString(), "11px Arial");
        this.addChild(this.stackView);
      }else {
        this.stackView.updateLabel(this.itemModel.currStacks.toString());
      }
    }else {
      if(this.stackView) {
        this.removeChild(this.stackView, true);
      }
    }
  }
}

class BankView extends NodeView {
	constructor( playerModel ) {
		super();

    this.playerModel = playerModel;
    this.bankPage = 0;

    this.setRect(200,200, "rgba(0,0,0,0.5)");
    
    var lblText = new NodeView();
    lblText.setLabel("Bank pg1", "14px Arial", "#FFFFFF");
    lblText.pos.y = -85;
    this.addChild(lblText);

    var btnClose = new ButtonView("btnCloseBank", "gfx/ui/btn_white_sm.sprite", "X", "18px Arial", "#FF0000");
    btnClose.pos.setVal(85,-85);
    this.addChild(btnClose);

    //TODO: navigate bank pages

    this.invSlots = [];
    var cols = 3;
    var slotsPerPage = PlayerModel.BANK_PAGE_SLOTS;
    var invStartX = -50;
    var invStartY = -50;
    var self = this;
    for(var i=0; i < slotsPerPage; i++) {
      var row = ~~(i/cols);
      var invSlot = new NodeView();
      invSlot.setRect(45,45, "rgba(0,0,0,1)");
      var col = i % cols;
      invSlot.pos.setVal(invStartX + col*50, invStartY + row*50);
      (function(i2) { //stupid javascript :P
        invSlot.setClick(function(){
          EventBus.ui.dispatch({evtName:"btnBankSlot", idx:i2, page:self.bankPage});
        });
      })(i); //pass 'i' into separate scope
      this.addChild(invSlot);
      this.invSlots.push(invSlot);
    }

    this.SetListener("bankChanged", this.onBankChanged);

    this.updateBankPage();
  }

  onBankChanged(e) {
    this.updateBankPage();
  }

  updateBankPage() {
    // var slotsPerPage = PlayerModel.BANK_PAGE_SLOTS;
    for(var i=0; i < this.invSlots.length; i++ ) {
      this.invSlots[i].removeAllChildren(true);
      var item = this.playerModel.getBankItem(this.bankPage, i);
      if(item) {
        var itemView = new ItemView(item);
        this.invSlots[i].addChild(itemView);
      }
    }
  }
}
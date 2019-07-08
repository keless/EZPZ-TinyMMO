import _ from './clientEZPZ.js'

export default class StoreView extends NodeView {
  constructor(storeId) {
    super();

    storeId = storeId || "default";
    this.storeJson = g_stores[storeId];

    this.page = 0;

    //transaction data
    this.sellIsInvItem = false;
    this.itemSlotIdx = 0;

    this.setRect(300,400, "rgba(0,0,0,0.5)");
            
    var lblText = new NodeView();
    lblText.setLabel("Store pg1", "14px Arial", "#FFFFFF");
    lblText.pos.y = -85;
    this.addChild(lblText);

    var btnClose = new ButtonView("btnCloseStore", "gfx/ui/btn_white_sm.sprite", "X", "18px Arial", "#FF0000");
    btnClose.pos.setVal(135,-185);
    this.addChild(btnClose);

    this.slots = [];
    var cols = 4;
    var rows = 5;
    var startX = -50;
    var startY = -50;
    var self = this;

    for(var i=0; i < (cols*rows); i++) {
      var row = ~~(i/cols);
      var slot = new NodeView();
      slot.setRect(45,45, "rgba(0,0,0,1)");
      var col = i % cols;
      slot.pos.setVal(startX + col*50, startY + row*50);
      (function(i2) { //stupid javascript :P
        slot.setClick(function(){
          EventBus.ui.dispatch({evtName:"btnStoreSlot", idx:i2, page:self.page});
        });
      })(i); //pass 'i' into separate scope
      this.addChild(slot);
      this.slots.push(slot);
    }

    this.updateStore();

    this.SetListener("playerSellIntent", this.onSellIntent);

    this.SetListener("btnStoreSlot", this.onBuyIntent);

    this.SetListener("btnSellConfirm", this.onSellConfirm);
    this.SetListener("btnBuyConfirm", this.onBuyConfirm);
    this.SetListener("btnCancelConfirm", this.onCancelConfirm);

    this.confirmView = null;
  }

  updateStore() {
    for(var i=0; i < this.slots.length && i < this.storeJson.items.length; i++) {
      this.slots[i].removeAllChildren(true);

      var itemModel = ItemModel.Get(this.storeJson.items[i]);
      var itemView = new ItemView(itemModel);
      this.slots[i].addChild(itemView);
    }
  }

  onBuyIntent(e) {
    this.itemSlotIdx = e.idx;
    this.itemPage = e.page;

    //todo: handle multiple pages

    var itemId = this.storeJson.items[this.itemSlotIdx];
    var itemModel = ItemModel.Get(itemId);

    this._closeConfirmView();
    this._openConfirmView( false, itemModel );
  }

  onSellIntent(e) {
    this.sellIsInvItem = e.isInvItem;
    this.itemSlotIdx = e.slotIdx;

    var itemModel = e.itemModel;

    this._closeConfirmView();
    this._openConfirmView( true, itemModel );
  }

  onSellConfirm(e) {
    if(!this.confirmView) return;
    
    var playerModel = PlayerModel.Get();
    var itemModel = null;
    if(this.sellIsInvItem) {
      //sell an inventory item
      itemModel = playerModel.takeItem(this.itemSlotIdx);
    }else {
      //sell an equipped item
      itemModel = playerModel.unequipItem(this.itemSlotIdx);
    }
    var price = itemModel.getPrice();

    if(itemModel.isStackable()) {
      price *= itemModel.currStacks;
    }

    price = ~~(price * (1.0 + playerModel.getBarterModifier()));

    playerModel.incGold(price);
    playerModel.save();

    this._closeConfirmView();
  }

  onBuyConfirm(e) {
    if(!this.confirmView) return;

    //TODO: handle pages
    this.itemPage;

    var itemId = this.storeJson.items[this.itemSlotIdx];

    var playerModel = PlayerModel.Get();
    playerModel.attemptPurchase(itemId);

    playerModel.save();

    this._closeConfirmView();
  }

  onCancelConfirm(e) {
    if(!this.confirmView) return;
    this._closeConfirmView();
  }

  _openConfirmView( isSelling, itemModel ) {
    if(this.confirmView == null) {
      this.confirmView = new StoreConfirmView(isSelling, itemModel);
      this.addChild(this.confirmView);
    }
  }
  
  _closeConfirmView() {
    if(this.confirmView != null) {
      this.removeChild(this.confirmView, true);
      this.confirmView = null;
    }
  }
}

class StoreConfirmView extends NodeView {
    constructor(isSelling, itemModel) {
        super();

        this.setRect(300,300, "rgba(0,0,0,0.8)");
        this.eatClicks();

        var price = itemModel.getPrice();
        var strPrice = formatMoneyString(price);
        this.lblPrice = new NodeView();
        this.lblPrice.setLabel(strPrice, "12px Arial", "#FFFFFF");
        this.lblPrice.pos.setVal(0, -75);
        this.addChild(this.lblPrice);

        var slot = new NodeView();
        slot.setRect(45,45, "rgba(0,0,0,1)");
        var itemView = new ItemView(itemModel);
        slot.addChild(itemView);
        this.addChild(slot);

        var confirmEvt = isSelling ? "btnSellConfirm" : "btnBuyConfirm";
        var confirmText = isSelling ? "Sell" : "Buy";
        var btnConfirm = new ButtonView(confirmEvt, "gfx/ui/btn_blue.sprite", confirmText, "20px Arial", "#FFFFFF");
        btnConfirm.pos.setVal(75, 75);
        this.addChild(btnConfirm);

        var btnCancel = new ButtonView("btnCancelConfirm", "gfx/ui/btn_blue.sprite", "Cancel", "20px Arial", "#FFFFFF");
        btnCancel.pos.setVal(-75, 75);
        this.addChild(btnCancel);
    }
}


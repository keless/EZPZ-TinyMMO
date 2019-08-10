import { NodeView, EventBus } from '../clientEZPZ.js'

export default class PlayerHudView extends NodeView {
	constructor( model ) {
		super();

    this.pPlayerModel = model;

    this.setRect(200, 100, "rgba(0,0,0,0.5)");

    this.lblLevel = new NodeView();
    this.lblLevel.setLabel("Level: ", "10px Arial", "#FFFFFF")
    this.lblLevel.pos.y = -30;
    this.addChild( this.lblLevel );

    this.lblStr = new NodeView();
    this.lblStr.setLabel("Str: ", "10px Arial", "#FFFFFF")
    this.lblStr.pos.y = -10;
    this.addChild( this.lblStr );

    this.lblInt = new NodeView();
    this.lblInt.setLabel("Int: ", "10px Arial", "#FFFFFF")
    this.lblInt.pos.y = 10;
    this.addChild( this.lblInt );

    this.lblAgi = new NodeView();
    this.lblAgi.setLabel("Agi: ", "10px Arial", "#FFFFFF")
    this.lblAgi.pos.y = 30;
    this.addChild( this.lblAgi );

    this.updateView();

    this.pPlayerModel.addListener("levelUp", this.updateView.bind(this));
    this.SetListener("playerStatsChanged", this.onStatsChanged);
  }

  Destroy() {
    this.pPlayerModel.removeListener("levelUp", this.updateView.bind(this));
    super.Destroy();
  }

  onStatsChanged(e) {
    this.updateView();
  }

  updateView() {
    var model = this.pPlayerModel;
    this.lblLevel.updateLabel("Level: " + model.xp_level);
    this.lblStr.updateLabel("STR: " + model.str_curr);
    this.lblInt.updateLabel("INT: " + model.int_curr);
    this.lblAgi.updateLabel("AGI: " + model.agi_curr);
  }
}
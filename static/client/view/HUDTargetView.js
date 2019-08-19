import NodeView from "../../shared/EZPZ/NodeView.js";
import EventBus from "../../shared/EZPZ/EventBus.js";
import CastTarget, { CastTargetType } from "../../shared/EZPZ/castengine/CastTarget.js";
import EntityView from "./EntityView.js";
import ClientGameController from "../controller/ClientGameController.js";

export default class HUDTargetView extends NodeView {
  constructor() {
    super()

    this.targetNode = null
    this.targetModel = null

    this.setRect(250, 50, "rgba(0,0,0, 0.5)")

    this.SetListener("targetChanged", this.onTargetChanged, EventBus.game)
  }

  _clearTargetNode() {
    if (this.targetNode) {
      //this.RemoveListener("update", this.onTargetUpdate, this.targetNode)
      this.targetNode.removeFromParent()
      this.targetNode = null
    }
  }

  _createTargetNode(entityModel) {
    this.targetNode = new EntityView(entityModel, false)
    this.addChild(this.targetNode)
    this.targetModel = entityModel
    //this.SetListener("update", this.onTargetUpdate, this.targetNode)
  }

  onTargetChanged(e) {
    var gameController = ClientGameController.instance
    var castTarget = gameController.playerTarget

    if (castTarget.getType() == CastTargetType.ENTITIES ) {
      var target = castTarget.getTargetEntity()
      if (target && target != this.targetModel) {
        this._clearTargetNode() 
        this._createTargetNode(target)
      }
    } else {
      this._clearTargetNode() 
    }
  }

}
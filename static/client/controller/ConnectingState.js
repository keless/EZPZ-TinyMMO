import { AppState, BaseStateView } from '../../shared/EZPZ/AppStateController.js'

class ConnectingState extends AppState {
	constructor() { 
		super();
		this.view = new ConnectingStateView();

		var protocol = Service.Get("protocol")
		protocol.beginConnection()
	}
}

class ConnectingStateView extends BaseStateView {
	constructor() {
		super();

		var label = new NodeView()
		label.setLabel("Connecting...", "24px Arial", "#FFFFFF")
		var pos = this.rootView.size.getScalarMult(0.5)
		label.pos.setVec(pos)
		this.rootView.addChild(label);
	}
}

export default ConnectingState
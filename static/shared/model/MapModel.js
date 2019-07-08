import _ from '../EZPZ/AppStateController.js'

class MapState extends AppState {
	constructor() {
		super();
		this.model = new MapModel();
		this.view = new MapView(this.model);
	}
}

export default class MapModel extends BaseStateModel {
	constructor() {
		super();
		console.log("map model loaded")
	}
	
}

export { MapModel, MapState }
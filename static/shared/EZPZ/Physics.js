import Service from './Service.js'

export default class Physics {
	constructor() {
		Service.Add("physics", this);
	}
	DrawDebug() {
		//TODO
	}
	Tick() {
		//perform physics step
			
		//TODO
	}
}

export { Physics }
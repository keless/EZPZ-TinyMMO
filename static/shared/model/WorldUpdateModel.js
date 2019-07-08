
/*
var worldUpdateModel = {
    worldTime: Date,
    entities: [EntityModel],
}
*/

export default class WorldUpdateModel {
    constructor( json ) {
        this.data = {}
        if (json) {
            this.fromPayloadJson(json)
        }
    }

    addEntities(entities) {
        if (!this.data.entities) {
            this.data.entities = []
        }
        this.data.entities = this.data.entities.concat(entities)
    }

    getPayloadJson() {
        return { "worldUpdate": this.data }
    }

    fromPayloadJson(json) {
        this.data = json
    }
}

export {WorldUpdateModel}
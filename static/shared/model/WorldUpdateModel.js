
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

    addPlayers(players) {
        if (!this.data.players) {
            this.data.players = []
        }
        this.data.players = this.data.players.concat(players)
    }

    getPayloadJson() {
        return this.data
    }

    fromPayloadJson(json) {
        this.data = json
    }
}

export {WorldUpdateModel}
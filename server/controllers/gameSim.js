const Game = require('../models/linvoGame')
const EntityModel = require('../../shared/model/EntityModel')


class GameSim {
    constructor() {

        startupFromDB()
    }

    startupFromDB() {


        //todo: when complete, start update loop
    }

    update() {
        // perform physics

        // perform AI
    }

    /// @return entityID if succesful, or null otherwise
    createCharacterForUser(userId, name, race, charClass) {
        var entity = new EntityModel()

        //xxx todo: validate params
        entity.initNewCharacter(userId, name, race, charClass)


        return entity.
    }
}

module.exports = {
    GameSim
}
"use strict"; //ES6

class SpawnFactory {

  static _getTypeLookupCache() {
    if(s_cachedTypeLookup == null) {
      s_cachedTypeLookup = {};
      for(var key in g_enemyTemplates) {
        var type = g_enemyTemplates[key].type;
        if(!s_cachedTypeLookup.hasOwnProperty(type)) {
          s_cachedTypeLookup[type] = [];
        }

        s_cachedTypeLookup[type].push(key);
      }
    }

    return s_cachedTypeLookup;
  }

  // given the location and player, spawn and return an appropriate enemy
  static SpawnEnemyForLocation(locIdx, playerModel) {

    var playerLevel = playerModel.getEntity().getProperty("xp_level");

    var loc = g_locations[locIdx];
    var spawnTable = g_spawnTable[loc.name] || g_spawnTable["default"];

    var locTier = loc.tier;
    var locLevelMax = locTier * 10;
    var locLevelMin = locLevelMax - 9;
    if(locTier == 6) {
      // special case for final tier
      locLevelMax = locLevelMin = 60;
    }

    var chosenLevel = locLevelMax;
    if( playerLevel < locLevelMin ) {
      chosenLevel = locLevelMin;
    }else if( playerLevel > locLevelMax ) {
      chosenLevel = locLevelMax;
    }else {
      var lower = Math.max(playerLevel - 2, locLevelMin);
      var upper = Math.min(playerLevel + 2, locLevelMax);
      chosenLevel = getRand(lower, upper);
    }

    var type = spawnTable.types[ getRand(0, spawnTable.types.length-1) ];
    console.log("spawn from type " + type + " at tier " + locTier);
    var typeLookup = SpawnFactory._getTypeLookupCache();
    var selection = s_cachedTypeLookup[type];

    var templateKey = selection[ getRand(0, selection.length-1) ];
    var enemyTemplate = g_enemyTemplates[templateKey];

    var enemy = new EntityModel();
		enemy.initWithJson(enemyTemplate);

    //scaling base curve
    var projectedPlayerHP = 30;
    for(var i=1; i < chosenLevel; i++ ) {
      projectedPlayerHP = ~~(projectedPlayerHP * 1.25);
    }

    //enemy HP scaling (linear!)
    enemy.setFullHP(~~(projectedPlayerHP * 0.4) );

    //enemy xp scaling (linear!)
    enemy.setProperty("xp_level", chosenLevel);
    enemy.setProperty("xp_next",  ~~(projectedPlayerHP * 0.07) );

    //enemy damage scaling (linear!)
    var damage = ~~(projectedPlayerHP * 0.07); 
    var abilityJson = 				
      {"name": enemyTemplate.name,
        "abilityId":"(enemy)",
				"castTime": 2,
				"cooldownTime": 1,
				"range": 500,
				"effectsOnCast": [
						{
								"effectType": "damage",
								"damageType": "piercing",
								"targetStat": "hp_curr",
								"valueBase": damage,
								"react": "shake"
						}
				]};  

    var castCommandModel = new CastCommandModel( abilityJson );
    var castCommandState = new CastCommandState(castCommandModel, enemy);
    enemy.addAbility(castCommandState);

    enemy.lootTable = g_lootTables[type];

    return enemy;
  }

  /**
   * return item or null
   */
  static DropLootForEnemy(enemyModel) {
    if(!enemyModel.lootTable) return null;

    var tier = Math.ceil(enemyModel.getProperty("xp_level") / 10);

    for(var lootId in enemyModel.lootTable) {
      var lootChance = enemyModel.lootTable[lootId];
      var chance = getRand(0, 100);
      if( chance < lootChance ) {

        if(lootId.includes("_1")) {
          var pre = lootId.substring(0, lootId.indexOf("1") );
          lootId = pre + tier.toString();
          console.log("drop loot tier corrected: " + lootId)
        }

        var itemModel = ItemModel.Get(lootId);

        if(itemModel.isStackable()) {
          itemModel.currStacks = 1;
        }

        return itemModel;
      }
    }
    return null;
  }
}

var s_cachedTypeLookup = null;
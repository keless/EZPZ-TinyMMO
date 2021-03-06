export {}
export var g_enemyTemplates = {
  "slime_std":{"name":"Slime", "type":"slime", "stats":{"hp_base":5, "xp_next":1}, "gold":1},
  "ooze_std":{"name":"Ooze", "type":"slime", "stats":{"hp_base":10, "xp_next":2}, "gold":0},
  "bandit_sml":{"name":"Starving Bandit", "type":"bandit", "stats":{"hp_base":10, "xp_next":2}, "gold":1},
  "bandit_std":{"name":"Bandit", "type":"bandit", "stats":{"hp_base":20, "xp_next":4}, "gold":5},
  "rat_std":{"name":"Rat", "type":"vermin", "stats":{"hp_base":5, "xp_next":1}, "gold":0},
  "rat_lrg":{"name":"Giant Rat", "type":"vermin", "stats":{"hp_base":25, "xp_next":6}, "gold":5},
  "wolf_sml":{"name":"Feral Dog", "type":"feral", "stats":{"hp_base":20, "xp_next":5}, "gold":5},
  "wolf_std":{"name":"Wolf", "type":"feral", "stats":{"hp_base":20, "xp_next":12}, "gold":5},
  "mage_nec":{"name":"Necromancer", "type":"mage", "stats":{"hp_base":35, "xp_next":12}, "gold":5},
  "crocodile":{"name":"Crocodile", "type":"swamp", "stats":{"hp_base":35, "xp_next":12}, "gold":5},
}

export var g_lootTables = {
  "slime":{"mat_leather_1":50, "mat_cloth_1":50,"wp_dagger_1":10},
  "bandit":{"mat_leather_1":50, "mat_cloth_1":50},
  "vermin":{"mat_leather_1":50, "mat_cloth_1":50, "wp_dagger_1":10},
  "feral":{"mat_leather_1":50},
  "mage":{"mat_cloth_1":50},
  "swamp":{"mat_leather_1":50,"arm_leather_1":10}
}
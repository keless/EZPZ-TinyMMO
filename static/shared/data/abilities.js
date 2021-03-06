export default {}
export var g_abilities = [
	{
		"name": "Attack",
		"castTime": 1.15,
		"cooldownTime": 1.85,
		"range": 500,
		"effectsOnCast": [
				{
						"effectType": "damage",
						"damageType": "piercing",
						"targetStat": "hp_curr",
						"valueBase": 2,
						"valueStat": "str",
						"valueMultiplier": 2,
						"react": "shake"
				}
		]
	}
];

export var g_races = [ "human", "gnome", "elf", "dwarf", "orc", "goblin", "centaur"];
export var g_classes = ["merchant", "warrior", "mage", "paladin", "priest", "rogue", "hunter"];

export var g_classTrees = {
	"human":{"name":"Human",
						"abilities":["attack1", "attack2", "p_dmgRdx1"], 
						"pos":[[0,0],[1,0],[0,2]]},
	"gnome":{"name":"Gnome",
						"abilities":["attack1", "attack2", "lifesteal1"], 
						"pos":[[0,0],[1,0],[0,1]]},
	"elf":{"name":"Elf",
						"abilities":["attack1", "p_heal1"],
						"pos":[[0,0],[0,1]]},
	"dwarf":{"name":"Dwarf",
						"abilities":["attack1", "p_dmgRdx1"],
						"pos":[[0,0],[0,2]]},
	"orc":{"name":"Orc",
						"abilities":["attack1", "p_dmgRdx1"],
						"pos":[[0,0],[0,2]]},
	"goblin":{"name":"Goblin",
						"abilities":["attack1", "p_goldFind1"],
						"pos":[[0,0],[0,2]]},
	"centaur":{"name":"Centaur",
						"abilities":["attack1", "p_dmgRdx1"],
						"pos":[[0,0],[0,2]]},
	"base":{"name":"Base",
						"abilities":["attack1"],
						"pos":[[0,0]]},
	"merchant":{"name":"Merchant",
						"abilities":["wand1", "p_barter1"],
						"pos":[[0,0], [1,2]]},
	"warrior":{"name":"Warrior",
						"abilities":["attack1", "fireball1"],
						"pos":[[0,0], [1,0]]},
	"mage":{"name":"Mage",
						"abilities":["wand1", "fireball1", "conflagrate1", "searbeam1", "p_dmgAura1"], 
						"pos":[[0,0], [1,0], [1,1], [1,2], [2,2]]},
	"paladin":{"name":"Paladin",
						"abilities":[
							"attack1", "lightHeal1", 
							"attack2", "fatedBlock1", 
							"retribution1","p_sacredChant",
							"holyShield1",
							"judgement1", "consecration1",
							"righteousFire1", "p_dmgRdx1",
							"p_heal1"],
						"pos":[[0,0], [0,2], 
									[1,0], [1,1],
									[2,0], [2,2],
									[3,1],
									[4,0], [4,2],
									[5,0], [5,1], 
									[6,2]
									]},
	"priest":{"name":"Priest",
						"abilities":["heal1", "hot1", "lifesteal1", "p_heal1"], 
						"pos":[[0,0], [0,1], [1,0], [2,2]]},
	"rogue":{"name":"Rogue",
						"abilities":["attack1", "fireball1"],
						"pos":[[0,0], [1,0]]},
	"hunter":{"name":"Hunter",
						"abilities":["attack1", "fireball1"],
						"pos":[[0,0], [1,0]]}
}

export var g_abilityCatalog =  
{
		"attack1":{
			"reqs": {
				"xp_level":1
			},
			"ranks":[
				{"name": "Weak Attack",
				"castTime": 1.15,
				"cooldownTime": 1.85,
				"range": 500,
				"effectsOnCast": [
						{
								"effectType": "damage",
								"damageType": "piercing",
								"targetStat": "hp_curr",
								"valueBase": 2,
								"react": "shake"
						}
				]},
				{"name": "Attack",
				"castTime": 1.15,
				"cooldownTime": 1.85,
				"range": 500,
				"effectsOnCast": [
						{
								"effectType": "damage",
								"damageType": "piercing",
								"targetStat": "hp_curr",
								"valueBase": 2,
								"valueStat": "str_curr",
								"valueMultiplier": 0.01,
								"react": "shake"
						}
				]}
			]
		},
		"attack2":{
			"reqs": {
				"xp_level":3,
				"ability":"attack1"
			},
			"ranks":[
				{"name": "Strong Attack",
				"castTime": 1.15,
				"cooldownTime": 1.85,
				"range": 500,
				"effectsOnCast": [
						{
								"effectType": "damage",
								"damageType": "piercing",
								"targetStat": "hp_curr",
								"valueBase": 2,
								"valueStat": "str_curr",
								"valueMultiplier": 0.10,
								"react": "shake"
						}
				]},
				{"name": "Strong Attack",
				"castTime": 1.15,
				"cooldownTime": 1.85,
				"range": 500,
				"effectsOnCast": [
						{
								"effectType": "damage",
								"damageType": "piercing",
								"targetStat": "hp_curr",
								"valueBase": 2,
								"valueStat": "str_curr",
								"valueMultiplier": 0.20,
								"react": "shake"
						}
				]}
			]
		},
		"wand1":{
			"reqs": {
				"xp_level":1
			},
			"ranks":[
				{"name":"Wand",
				"castTime": 0.5,
				"cooldownTime":2.5,
				"range":500,
				"effectsOnCast":[
						{
								"effectType": "damage",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 2,
								"valueStat": "int_curr",
								"valueMultiplier": 0.01,
								"react": "shake"
						}
				]}
			]
		},
		"fireball1":{
			"reqs": {
				"xp_level":2,
				"int_base":10
			},
			"ranks":[
				{"name":"Fireball",
				"castTime": 3.0,
				"cooldownTime":5.0,
				"range":500,
				"effectsOnCast":[
						{
								"effectType": "damage",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 5,
								"valueStat": "int_curr",
								"valueMultiplier": 0.02,
								"react": "shake"
						}
				]}
			]
		},
		"conflagrate1":{
			"reqs": {
				"xp_level":2,
				"int_base":10
			},
			"ranks":[
				{"name":"Conflagrate",
				"castTime": 0.5,
				"cooldownTime":10.0,
				"range":500,
				"effectsOnCast":[
						{
								"effectType": "damage",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "int_curr",
								"valueMultiplier": 0.2,
								"effectLifetime" : 5.0,
								"tickFreq":1.0,
								"react": "shake"
						}
				]}
			]
		},
		"searbeam1": {
			"reqs": {
				"xp_level":2,
				"int_base":10
			},
			"ranks":[
				{"name":"Searing Beam",
				"castTime": 0.0,
				"channelTime":5.0,
				"channelFreq": 1.0,
				"cooldownTime":1.0,
				"range":500,
				"effectsOnChannel":[
						{
								"effectType": "damage",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "int_curr",
								"valueMultiplier": 0.2,
								"tickFreq":1.0,
								"react": "shake"
						}
				]}
			]
		},
		"lifesteal1": {
			"reqs": {
				"xp_level":2,
				"int_base":10
			},
			"ranks":[
				{"name":"Lifesteal",
				"castTime": 0.0,
				"channelTime":5.0,
				"channelFreq": 1.0,
				"cooldownTime":10.0,
				"range":500,
				"effectsOnChannel":[
						{
								"effectType": "damage",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "int_curr",
								"valueMultiplier": 0.2,
								"tickFreq":1.0,
								"react": "shake",
								"returnEffect": {
									"effectType": "heal",
									"damageType": "magic",
									"targetStat": "hp_curr",
									"valueMultiplier":0.5
								}
						}
				]}
			]
		},
		"heal1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Blessing",
				"castTime": 1.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
								"effectType": "heal",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 5,
								"valueStat": "int_curr",
								"valueMultiplier": 0.02,
								"react": "glow"
						}
				]}
			]
		},
		"hot1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Renew",
				"castTime": 0.0,
				"cooldownTime":7.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
								"effectType": "heal",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "int_curr",
								"valueMultiplier": 0.1,
								"effectLifetime" : 5.0,
								"tickFreq":1.0,
								"react": "glow"
						}
				]}
			]
		},
		"p_dmgRdx1":{
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Resolve",
				"target":"self",
				"passiveEffects":[
					{
						"effectType":"dmgRedux",
						"damageType":"all",
						"valueMultiplier":0.25
					}
				]}
			]
		},
		"p_heal1":{
			"reqs":{
				"xp_level":3
			},
			"ranks":[
				{"name":"Regeneration",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "heal",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueStat": "hp_base",
								"valueMultiplier": 0.2,
								"react": "glow"
						}
				]}
			]
		},
		"p_dmgAura1": {
			"reqs": {
				"xp_level":3,
				"int_base":10
			},
			"ranks":[
				{"name":"Burning Aura",
				"range":500,
				"passiveEffects":[
						{
								"effectType": "damage",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "int_curr",
								"valueMultiplier": 0.2,
								"react": "burn"
						}
				]}
			]
		},
		"p_barter1": {
			"reqs": {
				"xp_level":1
			},
			"ranks":[
				{"name":"Barter",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "barter",
								"valueMultiplier": 0.1
						}
				] },
				{"name":"Barter",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "barter",
								"valueMultiplier": 0.2
						}
				]},
				{"name":"Barter",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "barter",
								"valueMultiplier": 0.3
						}
				]},
				{"name":"Barter",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "barter",
								"valueMultiplier": 0.4
						}
				]},
				{"name":"Barter",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "barter",
								"valueMultiplier": 0.5
						}
				]}
			]
		},
		"p_goldFind1": {
			"reqs": {
				"xp_level":1
			},
			"ranks":[
				{"name":"Gold Find",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "goldFind",
								"valueMultiplier": 0.1
						}
				]},
				{"name":"Gold Find",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "goldFind",
								"valueMultiplier": 0.2
						}
				]},
				{"name":"Gold Find",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "goldFind",
								"valueMultiplier": 0.3
						}
				]},
				{"name":"Gold Find",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "goldFind",
								"valueMultiplier": 0.4
						}
				]},
				{"name":"Gold Find",
				"target":"self",
				"passiveEffects":[
						{
								"effectType": "goldFind",
								"valueMultiplier": 0.5
						}
				]}
			]
		},
		"fatedBlock1": {
			"reqs": {
				"xp_level": 1
			},
			"ranks": [
				{ "name": "Fated Block",
					"castTime": 0,
					"cooldownTime": 7,
					"range": 500,
					"target": "self",
					"effectsOnCast": [
						{
							"effectType": "block",
							"damageType": "all",
							"targetStat": "hp_curr",
							"valueBase": 0,
							"valueStat": "str_curr",
							"valueMultiplier": 0.1,
							"effectLifetime": 5,
							"tickFreq": 1
						}
				]}
			]
		},
		"righteousFire1": {
			"reqs": {
				"xp_level": 1
			},
			"ranks": [
				{
					"name": "Righteous Fire",
					"castTime": 0,
					"cooldownTime": 7,
					"range": 500,
					"target": "self",
					"effectsOnCast": [
						{
							"effectType": "damage",
							"damageType": "holy",
							"targetStat": "hp_curr",
							"valueBase": 10,
							"valueStat": "int_curr",
							"valueMultiplier": 0.1
						}
					]
				}
			]
		},
		"lightHeal1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Light Heal",
				"castTime": 1.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
								"effectType": "heal",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 5,
								"valueStat": "int_curr",
								"valueMultiplier": 0.02,
								"react": "glow"
						}
				]}
			]
		},
		"mediumHeal1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Medium Heal",
				"castTime": 3.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
								"effectType": "heal",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "int_curr",
								"valueMultiplier": 0.2,
								"react": "glow"
						}
				]}
			]
		},
		"largeHeal1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Medium Heal",
				"castTime": 3.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
								"effectType": "heal",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "int_curr",
								"valueMultiplier": 0.2,
								"react": "glow"
						}
				]}
			]
		},
		"determination1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Determination",
				"castTime": 0.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
								"effectType": "heal",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "str_curr",
								"valueMultiplier": 0.01,
								"react": "glow"
						}
				]}
			]
		},
		"holyAvatar1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Holy Avatar",
				"castTime": 0.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
								"effectType": "buff",
								"damageType": "magic",
								"targetStat": "str_curr",
								"valueBase": 0,
								"valueStat": "str_base",
								"valueMultiplier": 0.02,
								"react": "glow"
						},
						{
								"effectType": "buff",
								"damageType": "magic",
								"targetStat": "int_curr",
								"valueBase": 0,
								"valueStat": "int_base",
								"valueMultiplier": 0.02,
								"react": "glow"
						},
						{
								"effectType": "buff",
								"damageType": "magic",
								"targetStat": "hp_curr",
								"valueBase": 0,
								"valueStat": "hp_base",
								"valueMultiplier": 0.01,
								"react": "glow"
						}
				]}
			]
		},
		"p_masochism":{
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Masochism",
				"target":"self",
				"passiveEffects":[
					{
						"effectType":"masochism",
						"damageType":"all",
						"valueMultiplier":0.05
					}
				]}
			]
		},
		"retribution1":{
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Retribution",
				"target":"self",
				"cooldownTime":5.0,
				"passiveEffects":[
					{
						"effectType":"dmgReflect",
						"damageType":"all",
						"valueMultiplier":0.20
					}
				]}
			]
		},
		"p_sacredChant":{
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Sacred Chant",
				"target":"self",
				"cooldownTime":5.0,
				"passiveEffects":[
					{
						"effectType":"restRedux",
						"valueBase": 5
					}
				]}
			]
		},
		"holyShield1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Holy Shield",
				"castTime": 0.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
								"effectType": "invulnerable",
								"damageType": "all",
								"targetStat": "str_curr",
								"effectLifetime": 4,
								"react":"holyBubble"
						}
				]}
			]
		},
		"judgement1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Judgement",
				"castTime": 0.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
							"effectType": "damage",
							"damageType": "holy",
							"targetStat": "hp_curr",
							"valueBase": 10,
							"valueStat": "int_curr",
							"valueMultiplier": 0.1
						}
				]}
			]
		},
		"consecration1": {
			"reqs":{
				"xp_level":1
			},
			"ranks":[
				{"name":"Consecration",
				"castTime": 0.0,
				"cooldownTime":5.0,
				"range":500,
				"target":"self",
				"effectsOnCast":[
						{
							"effectType": "damage",
							"damageType": "holy",
							"targetStat": "hp_curr",
							"valueBase": 10,
							"valueStat": "int_curr",
							"valueMultiplier": 0.1
						}
				]}
			]
		},
}
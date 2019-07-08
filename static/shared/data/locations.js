export {}
export var g_locations = [
  { "name":"The Tower", "pos":{ "x":-270,"y":100 }, "tier":2,
    "img":"gfx/bgs/bg_Tower.jpg", 
    "canReach":{
      "Dragon Saddle":[[-131,116],[-45,33]],
      "Kastador":[[-166,110],[14,148]],
      "Talmony":[[-480,170]],
      "Many Rivers":[[-256,193],[-227,260]]
  } },
  { "name":"Dragon Saddle", "pos":{ "x":-10,"y":-20 }, "tier":3,
    "img":"gfx/bgs/bg_DragonSaddle.jpg", 
    "canReach":{
      "The Tower":[[-45,33],[-131,116]],
      "Kastador":[[14,138]],
      "The Horns":[[110,-55]]
  } },
  { "name":"Many Rivers", "pos":{"x":-210,"y":270}, "tier":2,
    "img":"gfx/bgs/bg_ManyRivers.jpg", 
    "canReach":{
      "The Tower":[[-227,260],[-256,193]],
      "The Creep":[[0,400]]
  } },
  { "name":"Talmony", "pos":{"x":-650,"y":275},  "tier":1,
    "raceStart":["human", "dwarf"],
    "img":"gfx/bgs/bg_Talmony.jpg", 
    "canReach":{
      "The Tower":[[-480,170]]
  } },
  { "name":"Kastador", "pos":{"x":230,"y":200},  "tier":3,
    "img":"gfx/bgs/bg_Kastador.jpg", 
    "canReach":{
      "Dragon Saddle":[[14,138]],
      "The Tower":[[14,148],[-166,110]],
      "Kaisa":[[387,190],[496,178]]
  } },
  { "name":"Kaisa", "pos":{"x":555,"y":170},  "tier":4,
    "img":"gfx/bgs/bg_Kaisa.jpg", 
    "canReach":{
      "Kastador":[[496,178],[387,190]],
      "Sarathis":[[615,155]]
  } },
  { "name":"Sarathis", "pos":{"x":680,"y":120},  "tier":4,
    "img":"gfx/bgs/bg_Sarathis.jpg", 
    "canReach":{
      "Kaisa":[[615,155]]
  } },
  { "name":"The Creep", "pos":{"x":130,"y":550}, "tier":1,
    "raceStart":["elf", "gnome"],
    "img":"gfx/bgs/bg_Sarathis.jpg",
    "canReach":{
      "Many Rivers":[[0,400]]
  } },
  { "name":"Great Chasm", "pos":{"x":770,"y":-115}, "tier":5,
    "img":"gfx/bgs/bg_Sarathis.jpg" },
  { "name":"Gnoll Mesa", "pos":{"x":895,"y":-215},  "tier":5,
    "img":"gfx/bgs/bg_GnollMesa.jpg" },
  { "name":"Great Plains", "pos":{"x":230,"y":-270},  "tier":2,
    "img":"gfx/bgs/bg_GreatPlains.jpg", 
    "canReach":{
      "The Horns":[[220,-180]]
  } },
  { "name":"The Horns", "pos":{"x":210,"y":-90},  "tier":3,
    "img":"gfx/bgs/bg_Horns.jpg", 
    "canReach":{
      "Dragon Saddle":[[110,-55]],
      "Great Plains":[[220,-180]]
  } },
  { "name":"The Exiled", "pos":{"x":530,"y":-650},  "tier":6,
    "img":"gfx/bgs/bg_Exiled.jpg" },
     
  { "name":"Desert", "pos":{"x":817,"y":-472},  "tier":6,
    "img":"gfx/bgs/bg_Sarathis.jpg" },
    
  { "name":"Forbidden City", "pos":{"x":-360,"y":-350},  "tier":1,
    "raceStart":["orc", "goblin", "centaur"],
    "img":"gfx/bgs/bg_Sarathis.jpg" }
];

var g_spawnTable = {
  "default":{"types":["slime","vermin","bandit"]},
  "Dragon Saddle":{"types":["vermin", "feral","bandit"]},
  "The Tower":{"types":["slime","vermin","bandit","mage"]},
  "Many Rivers":{"types":["slime","swamp","bandit"]}
}
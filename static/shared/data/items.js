export {}
export class ItemType {
	static get TRASH() { return 0; }
  static get MAINHAND() { return 1; }
	static get ARMOR() { return 2; }
  static get OFFHAND() { return 3; }
  static get TWOHANDED() { return 4; }
  static get CRAFT() { return 5; }
}

export var g_items = {
  "wp_sword_1":{ type:ItemType.MAINHAND, hackColor:"#FF0000", stats:{"str_curr":10}, gold:5, sprite:"gfx/items/weap_sword.sprite" },
  "wp_dagger_1":{ type:ItemType.MAINHAND, hackColor:"#FF0000", stats:{"agi_curr":10}, gold:5, sprite:"gfx/items/weap_dagger.sprite" },
  "wp_axe_1":{ type:ItemType.TWOHANDED, hackColor:"#FF00FF", stats:{"str_curr":20}, gold:10, sprite:"gfx/items/weap_axe.sprite" },
  "wp_wand_1":{ type:ItemType.MAINHAND, hackColor:"#FF0000", stats:{"int_curr":10}, gold:5, sprite:"gfx/items/weap_staff.sprite" },

  "arm_cloth_1":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"int_curr":10}, gold:5, sprite:"gfx/items/arm_cloth.sprite" },
  "arm_leather_1":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"agi_curr":10}, gold:5, sprite:"gfx/items/arm_leather.sprite" },
  "arm_metal_1":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"str_curr":10}, gold:5, sprite:"gfx/items/arm_metal.sprite" },
  "arm_cloth_2":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"int_curr":30}, gold:5, sprite:"gfx/items/arm_cloth.sprite" },
  "arm_leather_2":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"agi_curr":30}, gold:5, sprite:"gfx/items/arm_leather.sprite" },
  "arm_metal_2":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"str_curr":30}, gold:5, sprite:"gfx/items/arm_metal.sprite" },
  "arm_cloth_3":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"int_curr":100}, gold:5, sprite:"gfx/items/arm_cloth.sprite" },
  "arm_leather_3":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"agi_curr":100}, gold:5, sprite:"gfx/items/arm_leather.sprite" },
  "arm_metal_3":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"str_curr":100}, gold:5, sprite:"gfx/items/arm_metal.sprite" },
  "arm_cloth_4":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"int_curr":300}, gold:5, sprite:"gfx/items/arm_cloth.sprite" },
  "arm_leather_4":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"agi_curr":300}, gold:5, sprite:"gfx/items/arm_leather.sprite" },
  "arm_metal_4":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"str_curr":300}, gold:5, sprite:"gfx/items/arm_metal.sprite" },
  "arm_cloth_5":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"int_curr":1000}, gold:5, sprite:"gfx/items/arm_cloth.sprite" },
  "arm_leather_5":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"agi_curr":1000}, gold:5, sprite:"gfx/items/arm_leather.sprite" },
  "arm_metal_5":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"str_curr":1000}, gold:5, sprite:"gfx/items/arm_metal.sprite" },
  "arm_cloth_6":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"int_curr":3000}, gold:5, sprite:"gfx/items/arm_cloth.sprite" },
  "arm_leather_6":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"agi_curr":3000}, gold:5, sprite:"gfx/items/arm_leather.sprite" },
  "arm_metal_6":{ type:ItemType.ARMOR, hackColor:"#00FF00", stats:{"str_curr":3000}, gold:5, sprite:"gfx/items/arm_metal.sprite" },

  "mat_cloth_1":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:1, maxStacks:100, sprite:"gfx/items/craft_cloth.sprite", sprIdx:0 },
  "mat_leather_1":{ type:ItemType.CRAFT, name:"Leather Scraps", hackColor:"#0000FF", gold:1, maxStacks:100, sprite:"gfx/items/craft_leather.sprite", sprIdx:0 },
  "mat_metal_1":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:1, maxStacks:100, sprite:"gfx/items/craft_metal.sprite", sprIdx:0 },
  "mat_cloth_2":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:5, maxStacks:100, sprite:"gfx/items/craft_cloth.sprite", sprIdx:1 },
  "mat_leather_2":{ type:ItemType.CRAFT, name:"Patched Leather", hackColor:"#0000FF", gold:5, maxStacks:100, sprite:"gfx/items/craft_leather.sprite", sprIdx:1  },
  "mat_metal_2":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:5, maxStacks:100, sprite:"gfx/items/craft_metal.sprite", sprIdx:1 },
  "mat_cloth_3":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:25, maxStacks:100, sprite:"gfx/items/craft_cloth.sprite", sprIdx:2 },
  "mat_leather_3":{ type:ItemType.CRAFT, name:"Light Leather", hackColor:"#0000FF", gold:25, maxStacks:100, sprite:"gfx/items/craft_leather.sprite", sprIdx:2  },
  "mat_metal_3":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:25, maxStacks:100, sprite:"gfx/items/craft_metal.sprite", sprIdx:2 },
  "mat_cloth_4":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:100, maxStacks:100, sprite:"gfx/items/craft_cloth.sprite", sprIdx:3  },
  "mat_leather_4":{ type:ItemType.CRAFT, name:"Medium Leather", hackColor:"#0000FF", gold:100, maxStacks:100, sprite:"gfx/items/craft_leather.sprite", sprIdx:3  },
  "mat_metal_4":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:100, maxStacks:100, sprite:"gfx/items/craft_metal.sprite", sprIdx:3  },
  "mat_cloth_5":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:500, maxStacks:100, sprite:"gfx/items/craft_cloth.sprite", sprIdx:4  },
  "mat_leather_5":{ type:ItemType.CRAFT, name:"Heavy Leather", hackColor:"#0000FF", gold:500, maxStacks:100, sprite:"gfx/items/craft_leather.sprite", sprIdx:4  },
  "mat_metal_5":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:500, maxStacks:100, sprite:"gfx/items/craft_metal.sprite", sprIdx:4  },
  "mat_cloth_6":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:2500, maxStacks:100, sprite:"gfx/items/craft_cloth.sprite", sprIdx:5 },
  "mat_leather_6":{ type:ItemType.CRAFT, name:"Studded Leather", hackColor:"#0000FF", gold:2500, maxStacks:100, sprite:"gfx/items/craft_leather.sprite", sprIdx:5  },
  "mat_metal_6":{ type:ItemType.CRAFT, hackColor:"#0000FF", gold:2500, maxStacks:100, sprite:"gfx/items/craft_metal.sprite", sprIdx:5 }
}

export var g_stores = {
  "default": {
    "items":[
      "wp_sword_1", "wp_dagger_1", "wp_axe_1", "wp_wand_1", 
      "arm_cloth_1", "arm_leather_1", "arm_metal_1", 
      "mat_cloth_1", "mat_leather_1", "mat_metal_1"
    ]
  }
}

export function formatMoneyString(money) {
    var mS = ~~(money / 100);
    var mC = money - mS*100;
    var mG = ~~(mS / 100);
    mS = mS - mG*100;
    var mP = ~~(mG / 100);
    mG = mG - mP*100;
    return (mP+"p "+mG+"g "+mS+"s "+mC+"c");
}
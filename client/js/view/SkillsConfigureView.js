"use strict"; //ES6


/*

<skillTreeTab1><skillTreeTab2><skillTreeTab3><skillTreeTab4>
/-----------------currentSkillTreeView---------------------\






\----------------------------------------------------------/
<chosenAbility><chosenAbility><chosenAbility><chosenAbility>
<chosenAbility><chosenAbility><chosenAbility><chosenAbility>

where chosenAbility has
<name   (x)>
*/

class SkillsConfigureView extends NodeView {
	constructor( playerModel ) {
		super();

    this.playerModel = playerModel;
    this.skillModel = this.playerModel.getSkillsModel();
    this.treeIdx = 0;

    this.abilityWindow = null;
		
    var screenSize = Graphics.ScreenSize;
    this.setImageStretch("gfx/workbench3.png", 0,0, screenSize.x, screenSize.y);
    this.eatClicks();

		var lblText = new NodeView();
		lblText.setRect(500, 40, "rgba(0,0,0,0.4)")
		lblText.setLabel("Spells & Abilities", "20px Arial", "#FFFFFF");
		lblText.pos.setVal(screenSize.x/2, 50);
		this.addChild(lblText);

		this.lblPoints = new NodeView();
		this.lblPoints.setLabel("Points: X", "14px Arial", "#FFFFFF");
		this.lblPoints.pos.setVal(screenSize.x/2 + 40, 80);
		this.addChild(this.lblPoints);

    this.btnReset = new ButtonView("btnResetSkills", "gfx/ui/btn_blue.sprite", "Reset All");
    this.btnReset.pos.setVal(screenSize.x/2 - 100, 80);
    this.addChild(this.btnReset);

    var btnClose = new ButtonView("btnCloseSkills", "gfx/ui/btn_blue.sprite", "Done");
    btnClose.pos.setVal(screenSize.x - 75, 50);
    this.addChild(btnClose);
 
    var leftX = screenSize.x/2 - 250;

    this.treeTabHighlight = new NodeView();
    this.treeTabHighlight.setRect(150, 50, "rgb(0,255,255)");
    this.addChild(this.treeTabHighlight);

    this.treeTabs = [];
    var skillModel = this.skillModel;
    var treeKeys = Object.keys(skillModel.trees);
    for(var i=0; i < treeKeys.length; i++) {
      var tree = skillModel.trees[treeKeys[i]];
      var btn = new ButtonView("tabTree", "gfx/ui/btn_white.sprite", tree.name, "14px Arial", "#000000", {idx:i});
      btn.pos.setVal(leftX + i*160, 150);
      this.addChild(btn);
      this.treeTabs.push(btn);
    }

    this.treeView = new NodeView();
    this.treeView.setRect(800, 400, "rgba(20,20,20,0.5)");
    this.treeView.pos.setVal(screenSize.x/2, screenSize.y/2);
    this.addChild(this.treeView);

    this.abilitySlots = [];
    var numSlotCols = 4;
    var numSlotRows = 2;
    var slotsY = screenSize.y - 150;
    for(var y=0; y<numSlotRows; y++) {
      for(var x=0; x< numSlotCols; x++) {
        var slot = new NodeView();
        slot.setRect(150, 50, "#FFFFFF");
        slot.pos.setVal(leftX + x*160, slotsY + y*60);
        this.addChild(slot);
        this.abilitySlots.push(slot);
      }
    }

    this.selectTab(0);
    this.updateChosenAbilities();
    this.updatePoints();

    this.SetListener("tabTree", this.onTabTree);
    this.SetListener("btnSkillTree", this.onBtnSkillTree);
    this.SetListener("btnSkillEquip", this.onBtnSkillEquip);
    this.SetListener("btnCloseAbilityView", this.onBtnCloseAbilityView);
    this.SetListener("btnUnequipSkill", this.onBtnUnequipSkill);
    this.SetListener("btnEquipSkill", this.onBtnEquipSkill);
    this.SetListener("btnSkillUp", this.onBtnSkillUp);
    this.SetListener("btnResetSkills", this.onBtnResetSkills);
    this.SetListener("playerSkillRankUp", this.onSkillRankChanged);
    this.SetListener("playerSkillsReset", this.onSkillRankChanged);
    this.SetListener("playerEquippedSkill", this.onPlayerEquippedSkillUpdate);
    this.SetListener("playerUnequippedSkill", this.onPlayerEquippedSkillUpdate);
  }

  onBtnResetSkills(e) {
    this.skillModel.resetAllRanks();
  }

  onSkillRankChanged(e) {
    this.updatePoints();
  }

  updatePoints() {
    this.lblPoints.updateLabel("Points: " + this.skillModel.getUnusedPoints());
  }

  onTabTree(e) {
    this.selectTab(e.idx);
  }

  selectTab( idx ) {
    this.treeTabHighlight.pos.setVec(this.treeTabs[idx].pos);
    this.treeTabHighlight.pos.y += 5;

    this._hideAbilityWindow();

    this.showTreeView(idx);
  }

  showTreeView(treeIdx) {
    this.treeIdx = treeIdx;
    var skillModel = this.skillModel;
    var treeKeys = Object.keys(skillModel.trees);
    var tree = skillModel.trees[treeKeys[treeIdx]];
    var abilityIds = tree.abilities;
    var positions = tree.pos;

    //clear tree view
    this.treeView.removeAllChildren(true);

    var startX = -400 + 80;
    var startY = -200 + 60;

    var colW = 80;
    var rowH = 80;

    //check prereqs
    for(var i=0; i < abilityIds.length; i++) {
      var abilityId = abilityIds[i];

      //check if ability has an ability prereq
      var preReqAbility = this.skillModel.getAbilityPrereqForSkill(abilityId);
      if(!preReqAbility) continue;
      var reqIdx = tree.abilities.indexOf(preReqAbility);

      //get pos of current ability
      var vecTo = new Vec2D(startX + positions[i][0] * colW, startY + positions[i][1] * rowH);
      //get pos of required ability
      var vecFrom = new Vec2D(startX + positions[reqIdx][0] * colW, startY + positions[reqIdx][1] * rowH);
      var reqLine = new NodeView();
      reqLine.setPolygon([vecTo, vecFrom], "#FFFF00", "#FFFF00", 8);
      this.treeView.addChild(reqLine);
    }

    //todo: sort by level/requirements
    for(var i=0; i < abilityIds.length; i++) {
      var abilityId = abilityIds[i];
      var abilityName = g_abilityCatalog[ abilityId ].ranks[0].name;
      //todo: spell icons
      //todo: send ability id in event
      var x = startX + positions[i][0] * colW;
      var y = startY + positions[i][1] * rowH;
      var abilityNode = new AbilityIconView(skillModel, abilityId, x, y);

      abilityNode.pos.setVal(x, y);

      this.treeView.addChild(abilityNode);
    }
  }


  onBtnSkillTree(e) {
    var abilityId = e.abilityId;
    this.showAbilityWindow(abilityId, true, e.x, e.y);
  }

  onBtnSkillEquip(e) {
    var abilityId = e.abilityId;
    this.showAbilityWindow(abilityId, false, e.x, e.y);
  }

  showAbilityWindow(abilityId, fromTreeView, x, y) {
    this._hideAbilityWindow();

    var rank = this.skillModel.getSkillRanks(abilityId);
    var window = new AbilityInfoView(abilityId, rank);
    window.pos.setVal(x,y - 125);

    if(fromTreeView) {
      window.addEquipView(abilityId, 50);
      this.treeView.addChild(window);
    }else {
      window.addUnequipView(abilityId, 50);
      this.addChild(window);
    }

    this.abilityWindow = window;
  }

  onBtnCloseAbilityView(e) {
    this._hideAbilityWindow();
  }
  _hideAbilityWindow() {
    if(this.abilityWindow != null) {
      this.abilityWindow.removeFromParent(true);
      this.abilityWindow = null;
    }
  }

  onBtnEquipSkill(e) {
    var skillModel = this.skillModel;
    skillModel.equipSkill(e.abilityId);

    skillModel.applyToEntity(this.playerModel.entity);
    this.playerModel.save();

    this._hideAbilityWindow();
  }
  onBtnSkillUp(e) {
    var skillModel = this.skillModel;
    skillModel.addSkillRank(e.abilityId);

    skillModel.applyToEntity(this.playerModel.entity);
    this.playerModel.save();
  }

  onBtnUnequipSkill(e) {
    var skillModel = this.playerModel.getSkillsModel();
    skillModel.unequipSkill(e.abilityId);

    skillModel.applyToEntity(this.playerModel.entity);
    this.playerModel.save();

    this._hideAbilityWindow();
  }

  onPlayerEquippedSkillUpdate(e) {
    this.updateChosenAbilities();
  }

  updateChosenAbilities() {
    var skillModel = this.playerModel.getSkillsModel();

    //clear current abilities
    for(var i=0; i < this.abilitySlots.length; i++) {
      this.abilitySlots[i].removeAllChildren(true);
    }

    for(var i=0; i < skillModel.chosen.length; i++) {
      var abilityId = skillModel.chosen[i];
      var abilityName = g_abilityCatalog[ abilityId ].ranks[0].name;

      var pos = this.abilitySlots[i].pos;
      var abilityNode = new ButtonView("btnSkillEquip", "gfx/ui/btn_white.sprite", abilityName, "14px Arial", "#000000", {abilityId:abilityId, x:pos.x, y:pos.y });
      this.abilitySlots[i].addChild(abilityNode);
    }
  }


}

class AbilityIconView extends NodeView {
  static get GREY() { return "#777777"; }
  static get GREEN() { return "#00FF00"; }
  static get YELLOW() { return "#FFFF00"; }

  //visual states:
  //yellow outline (maxed out)
  //green outline (unlocked but not maxed)
  //greyed out, stack count visible (unlocked but zero points invested and available)
  //greyed out (not unlocked)

  constructor( skillModel, abilityId, x, y ) {
    super();

    this.abilityId = abilityId;
    this.skillModel = skillModel;
    var abilityName = g_abilityCatalog[ abilityId ].ranks[0].name;
    
    this.highlightColor = AbilityIconView.GREY;
    var w = 50; var h = 50;
    this.size.setVal(w,h);
    var self = this;
    this.addCustomDraw(function(gfx,x,y,ct){
			if(self.alpha != 1.0) gfx.setAlpha(self.alpha);
			gfx.drawRectEx(x, y, w, h, self.highlightColor);
			if(self.alpha != 1.0) gfx.setAlpha(1.0);
    });

    this.setClick(function(e,mx,my){
      e.isDone = true;
      EventBus.ui.dispatch({evtName:"btnSkillTree", abilityId:abilityId, x:x, y:y});
    });

    //this.setLabelWithOutline(abilityName, "8px Arial" );
    var abilityIdx = Object.keys(g_abilityCatalog).indexOf(abilityId);
    var icon = new NodeView();
    icon.setSprite("gfx/abilities/abilityIcons.sprite", 1+ abilityIdx);
    icon.scale = 2;
    icon.pixelated = true;
    this.addChild(icon);

    this.stackNode = new NodeView();
    this.stackNode.setRect(10,10, "rgba(0,0,0,0.6)");
    this.stackNode.setLabelWithOutline("0", "9px Arial", this.highlightColor)
    this.stackNode.pos.setVal(25,25);
    this.addChild(this.stackNode);

    this.updateStackCount();

    this.SetListener("playerSkillRankUp", this.onSkillRankChanged);
    this.SetListener("playerSkillsReset", this.onSkillRankChanged);
  }

  onSkillRankChanged(e) {
    this.updateStackCount();
  }

  updateStackCount() {
    //console.log("update stack count")
    var count = this.skillModel.getSkillRanks(this.abilityId);
    //console.log("stack count is " + count)

    if(count == 0) {
      var points = this.skillModel.getUnusedPoints();
      if(points == 0) {
        this.setHighlightColor(AbilityIconView.GREY, AbilityIconView.GREY);
      }else {
        if(this.skillModel.isSkillUnlocked(this.abilityId)) {
          this.setHighlightColor(AbilityIconView.GREEN, AbilityIconView.GREEN);
        }else {
          this.setHighlightColor(AbilityIconView.GREY, AbilityIconView.GREY);
        }
      }
    }else {
      if(this.skillModel.isSkillMaxed(this.abilityId)) {
        this.setHighlightColor(AbilityIconView.YELLOW, AbilityIconView.YELLOW);
      }else {
        var points = this.skillModel.getUnusedPoints();
        if(points == 0) {
          this.setHighlightColor(AbilityIconView.GREY, AbilityIconView.GREEN);
        }else {
          this.setHighlightColor(AbilityIconView.GREEN, AbilityIconView.GREEN);
        }
      }
    }

    this.stackNode.updateLabel( count );
  }

  setHighlightColor( color, stackColor ) {
    this.highlightColor = color;
    this.stackNode.updateLabelStyle(stackColor);
  }
}

class AbilityInfoView extends NodeView {
  constructor( abilityId, rank ) {
    super();


    rank = Math.max(rank, 1);
    var abilityJson = g_abilityCatalog[abilityId].ranks[rank - 1];

    this.setRect(200,200, "rgba(200,200,200, 0.8)");
    this.eatClicks();

    var btnClose = new ButtonView("btnCloseAbilityView", "gfx/ui/btn_white_sm.sprite", "X", "18px Arial", "#FF0000");
    btnClose.pos.setVal(85,-85);
    this.addChild(btnClose);

    var lblName = new NodeView();
    lblName.setLabel(abilityJson.name, "14px Arial", "#000000");
    lblName.pos.setVal(-50, -80);
    this.addChild(lblName);

    var lblDesc = new NodeView();
    lblDesc.setLabel(this.getDescription(abilityId, rank), "12px Arial", "#000000", true);
    this.addChild(lblDesc);
  }

  addUnequipView( abilityId, offset ) {
    offset = offset || 1;
    var view = new NodeView();
    view.setRect(200, 60, "rgba(200,200,200, 0.8)");
    view.eatClicks();
    view.pos.setVal(0, 130 + offset);

    var btnUnequip = new ButtonView("btnUnequipSkill", "gfx/ui/btn_white.sprite", "Remove", null, "#000000", {abilityId:abilityId});
    view.addChild(btnUnequip);

    this.addChild(view);
  }

  addEquipView( abilityId, offset ) {
    offset = offset || 1;
    var view = new NodeView();
    view.setRect(200, 60, "rgba(200,200,200, 0.8)");
    view.eatClicks();
    view.pos.setVal(0, 130 + offset);

    var btnUnequip = new ButtonView("btnEquipSkill", "gfx/ui/btn_white.sprite", "Choose", null, "#000000", {abilityId:abilityId});
    btnUnequip.pos.x += 20;
    view.addChild(btnUnequip);

    var btnUp = new ButtonView("btnSkillUp", "gfx/ui/btn_white_sm.sprite", "+", null, "#000000", {abilityId:abilityId});
    btnUp.pos.x -= 70;
    view.addChild(btnUp);

    this.addChild(view);
  }

  getDescription(abilityId, rank) {
    var abilityJson = g_abilityCatalog[abilityId].ranks[rank - 1];
    var des = "";
    if(!abilityJson) return des;

    if("passiveEffects" in abilityJson) {
      des += "PASSIVE\n";
    }

    if(abilityJson["target"] == "self") {
      des += "Self Targeted\n";
    }

    if("castTime" in abilityJson) {
      var time = abilityJson["castTime"];
      des += "Cast: "
      if(time > 0) {
        des += abilityJson["castTime"] + "s";
      }else {
        des += "Instant";
      }
      
      des += "\n";
    }

    if("channelTime" in abilityJson) {
      var freq = abilityJson["channelFreq"] + "t/s"
      var period = abilityJson["channelTime"] + "s";
      des += "Channel: " + freq + " for " + period;
      des += "\n";
    }

    if("cooldownTime" in abilityJson) {
      des += "CD: " + abilityJson["cooldownTime"] + "s";
      des += "\n";
    }

    if("effectsOnCast" in abilityJson) {
      des += "On Cast:\n";
      for( var i=0; i< abilityJson.effectsOnCast.length; i++) {
        var effect = abilityJson.effectsOnCast[i];
        switch(effect.effectType) {
          case "heal":
          des += " heals " + this._getEffectValueString(effect);
          
          break;
          case "damage":
          des += " damage  " + this._getEffectValueString(effect);
          break;
        }
      }
    }
    


    return des;
  }

  _getEffectValueString(effectJson) {
    var valueBase = effectJson["valueBase"] || 0;
    var valueStat = effectJson["valueStat"] || "";
    var des = "";
    if(!valueBase && !valueStat) return des;

    if(valueBase > 0) {
      des += valueBase.toString();

      if(valueStat.length > 0) {
        des += " + ";
      }
    }

    if(valueStat.length > 0) {
      var playerModel = PlayerModel.Get();
      var entity = playerModel.getEntity();
      var casterStatValue = entity.getProperty(valueStat);
      var valueMultiplier = (effectJson["valueMultiplier"] || 1.0);
      var statAddedValue =  casterStatValue * valueMultiplier;
      statAddedValue = Math.max(statAddedValue, 1); //minimum 1
      var strValueStat = valueStat.substr(0, valueStat.indexOf('_'));
      des += ~~(statAddedValue).toString() + " ("+strValueStat+" * "+valueMultiplier+")";
    }
    
    des += "\n";
    return des;
  }
}
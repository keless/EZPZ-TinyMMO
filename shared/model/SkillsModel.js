"use strict"; //ES6


class ISkillsModelDelegate {
  // return array of string classTree names
  getSkillTrees() { return ["base"] }

  // number of points player can invest in skills
  getPoints() { return 1; }

  getXpLevel() { return 1; }
}

/**
 * sends events:
 *  playerSkillsReset - when skills are reset
 *  playerSkillRankUp - when a skill is increased
 *  playerEquippedSkill - when a skill is equipped
 *  playerUnequippedSkill - when a skill is unequipped
 */

class SkillsModel {
  constructor( iDelegate ) {
    this.delegate = iDelegate;
    this.trees = []; //array of [{name:str, abilities:[abilityId, ... ]}, ... ]
    this.chosen = []; //str array of abilityIds

    this.pointAllocations = {}; //hash of <abilityId:pts>
  }

  initWithJson(json) {
    this.trees = json["trees"] || {};
    this.chosen = json["chosen"] || [];
    this.pointAllocations = json["ranks"] || {};

    var skillTrees = this.delegate.getSkillTrees();
    this.trees = {};
    for( var i=0; i< skillTrees.length; i++) {
      this.trees[ skillTrees[i] ] = g_classTrees[skillTrees[i]];
    }
  }
  
  toJson() {
    var json = {
      trees:this.trees,
      chosen:this.chosen,
      ranks:this.pointAllocations
    };
    return json;
  }

  getUnusedPoints() {
    var total = this.delegate.getPoints();
    if(Object.keys(this.pointAllocations).length > 0) {
      for(var key in this.pointAllocations ) {
        total -= this.pointAllocations[key];
      }
    }
    //console.log("unused points: " + total)
    return total;
  }

  getSkillRanks( skillId ) {
    return this.pointAllocations[ skillId ] || 0;
  }

  getMaxSkillRanks( skillId ) {
    return g_abilityCatalog[skillId].ranks.length;
  }

  isSkillMaxed( skillId ) {
    var maxRanks = this.getMaxSkillRanks(skillId);
    var currRanks = this.getSkillRanks(skillId);
    return currRanks >= maxRanks;
  }

  resetAllRanks() {
    this.pointAllocations = {};
    this.chosen.length = 0;
    EventBus.ui.dispatch({evtName:"playerSkillsReset"});
    EventBus.ui.dispatch({evtName:"playerUnequippedSkill"});
  }

  isSkillUnlocked( skillId ) {
    var preReqs = g_abilityCatalog[skillId].reqs;
    if(!preReqs) return true;

    var allReqsMet = true;
    for(var key in preReqs) {
      var req = preReqs[key];
      switch(key) {
        case "xp_level":
          var reqLevel = req;
          var playerLevel = this.delegate.getXpLevel();
          if(playerLevel < reqLevel) {
            allReqsMet = false;
            break;
          }
        break;
        case "ability":
          var reqAbilityId = req;
          //console.log("preReq("+skillId+") check " + reqAbilityId + " is maxed")
          if(!this.isSkillMaxed(reqAbilityId)) {
            allReqsMet = false;
            //console.log("ablity locked because prereq ability not maxed")
            break;
          }
        break;
      }
    }

    return allReqsMet;
  }

  getAbilityPrereqForSkill( skillId ) {
    var preReqs = g_abilityCatalog[skillId].reqs;
    if(!preReqs) return null;
    return preReqs.ability;
  }

  addSkillRank( skillId ) {
    //console.log("add skill rank")
    if( !this.isSkillMaxed(skillId) 
      && (this.getUnusedPoints() > 0)
      && this.isSkillUnlocked(skillId)) 
    {
      //console.log("add rank to " + skillId);
      var pts = this.pointAllocations[skillId] || 0;
      //console.log ( "from " + pts) ;
      this.pointAllocations[skillId] = pts + 1;
      //console.log ( "to " + this.pointAllocations[skillId])
      EventBus.ui.dispatch({evtName:"playerSkillRankUp"});
    }
  }

  equipSkill( skillId ) {
    if( this.getSkillRanks(skillId) < 1 ) {
      return; //cant equip skill with no points allocated
    }

    removeFromArray(this.chosen, skillId);
    this.chosen.push(skillId);
    EventBus.ui.dispatch({evtName:"playerEquippedSkill"});
  }
  unequipSkill( skillId ) {
    removeFromArray(this.chosen, skillId);
    EventBus.ui.dispatch({evtName:"playerUnequippedSkill"});
  }

  applyToEntity(entityModel) {
    entityModel.clearAbilities();
    for(var i=0; i<this.chosen.length; i++) {
      var abilityId = this.chosen[i];
      var rank = this.getSkillRanks(abilityId);
      rank = Math.max(rank, 1);
      var castCommandJson = g_abilityCatalog[abilityId].ranks[rank - 1]; 
      castCommandJson.abilityId = abilityId;
      var castCommandModel = new CastCommandModel( castCommandJson );
			var castCommandState = new CastCommandState(castCommandModel, entityModel);
      castCommandState.setDelegate(entityModel);
      entityModel.addAbility(castCommandState);
    }
  }
}
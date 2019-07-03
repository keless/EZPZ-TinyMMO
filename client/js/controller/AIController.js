"use strict"; //ES6

class AIController {
	constructor( entityModel ) {
		this.pEntityModel = entityModel;
		
		this._isPaused = false;
	}

	Destroy() {
		this.pEntityModel = null;
	}
	
	pause() {
		this._isPaused = true;
	}
	unpause() {
		this._isPaused = false;
	}

	Update(ct, dt) {
		if( !this.pEntityModel.canCast() || this._isPaused ) return;
		
		var battleStateModel = Service.Get("battleStateModel");
		
		var abilities = this.pEntityModel.getAbilities();
		var ignoreFriendlies = [ this.pEntityModel ];
		for(var a of abilities) {
			// spell priority based on order in abilities array
			if( a.isIdle() && a.canAfford() ) {
				//attempt to find target for ability
				
				var abilityRange = a.getRange();
			
				var targetEntity = null;
				if(a.isSelfTargeted()) {
					//if healing spell, target self
					targetEntity = this.pEntityModel;
				}else {
					//if damaging spell, target enemy
					var targetEntities = battleStateModel.GetEntitiesInRadius( this.pEntityModel.pos, abilityRange, ignoreFriendlies );
					if( targetEntities.length == 0 ) continue;
					targetEntity = targetEntities[0];

					//todo: handle AOE
				}

				var targetGroup = this.pEntityModel.getTarget();
				targetGroup.clearTargetEntities();
				targetGroup.addTargetEntity(targetEntity);
				
				a.startCast();
				break;
			}
		}
	}
}
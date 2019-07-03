"use strict"; //ES6

class Facing {
	static get UP() { return 0; }
	static get RIGHT() { return 1; }
	static get DOWN() { return 2; }
	static get LEFT() { return 3; }
}

/*
	dispatches event:
	"update" when Update() is called
	"dead" entity:this  when health reaches zero
*/

class EntityModel extends ICastEntity {
	
	// in: string name
	constructor() {
		super();

		this.eventBus = new EventBus("entityModel");
		this.eventBus.verbose = false;

		this.name = "(null)";
		this.race = "";
		this.class = "";

		this.isDead = false;
		this.deadTime = 0;

		this.hp_base = 100;
		this.hp_curr = this.hp_base;

		this.xp_level = 1;
		this.xp_next = 10;
		this.xp_curr = 0;

		this.int_base = this.int_curr = 10;
		this.str_base = this.str_curr = 10;
		this.agi_base = this.agi_curr = 10;

		this.negativeEffects = [];
		this.positiveEffects = [];
		this.buffs = {};
		this.debuffs = {};

		this.inventory = new InventoryModel();
		
		this.m_abilities = [];
		this.m_abilityTargets = new CastTarget();

		this.m_passiveUpdatePeriod = 5.0;
		this.m_lastPassiveUpdate = 0;
		this.m_passiveAbilities = [];

		this.pos = new Vec2D();
		this.facing = Facing.RIGHT;
	}

	initWithJson(json) {
		this.name = json["name"] || "No Name";
		this.race = json["race"] || "base";
		this.class = json["class"] || "";
		
		if(json["stats"]) {
			this.hp_curr = this.hp_base = json.stats["hp_base"] || this.hp_base;
			this.xp_level = json.stats["xp_level"] || this.xp_level;
			this.xp_next = json.stats["xp_next"] || this.xp_next;
			this.xp_curr = json.stats["xp_curr"] || this.xp_curr;
			this.int_curr = this.int_base = json.stats["int_base"] || this.int_base;
			this.str_curr = this.str_base = json.stats["str_base"] || this.str_base;
			this.agi_curr = this.agi_base = json.stats["agi_base"] || this.agi_base;
		}

		if(json["inventory"]) {
			this.inventory.initWithJson(json["inventory"]);
		}

		// hack to allow enemy spawn to avoid inventory but reward gold to player
		if(json["gold"]) {
			this.inventory.incGold(json["gold"]);
		}

		//spawn factory handles abilities for enemies, and 
		//playerModel skillModel handles them for player

		if(!json["pos"]) {
			this.pos.setVal(0,0);
		}else {
			this.pos.setVal(json.pos.x, json.pos.y);
		}

		this.facing = Facing.RIGHT;
		this.isDead = false;
		this.negativeEffects = [];
		this.positiveEffects = [];
		this.buffs = {};
		this.debuffs = {};
	}

	toJson() {
		var inv = this.inventory.toJson();
		//var abilities = []; //this is managed by skillModel
		var json = {
			name: this.name,
			race: this.race,
			class: this.class,
			stats:{
				hp_base: this.hp_base,
				xp_level: this.xp_level,
				xp_next: this.xp_next,
				xp_curr: this.xp_curr,
				int_base: this.int_base,
				str_base: this.str_base,
				agi_base: this.agi_base,
			},
			inventory:inv
		};
		return json;
	}

	Destroy() {
		super.Destroy();
	}

	healFull() {
		this.hp_curr = this.hp_base;
	}
	
	//array of abilities
	getAbilities() {
		return this.m_abilities;
	}

	getPassiveAbilities() {
		return this.m_passiveAbilities;
	}

	getPassiveDmgRedux() {
		var result = 0.0;
		for(var i=0; i<this.m_passiveAbilities.length; i++) {
			result += this.m_passiveAbilities[i].getPassiveOfType("dmgRedux");
		}
		return result;
	}

	getPassiveBarterModifier() {
		var result = 0.0;
		for(var i=0; i<this.m_passiveAbilities.length; i++) {
			result += this.m_passiveAbilities[i].getPassiveOfType("barter");
		}
		return result;
	}

	getPassiveGoldFindModifier() {
		var result = 0.0;
		for(var i=0; i<this.m_passiveAbilities.length; i++) {
			result += this.m_passiveAbilities[i].getPassiveOfType("goldFind");
		}
		return result;
	}

	clearAbilities() {
		for( var a of this.m_abilities ) {
			a.stopCasting();
			//a.Destroy();
		}
		this.m_abilities.length = 0;

		this.m_passiveAbilities.length = 0;
	}

	addAbility(castCommandState) {
		if(castCommandState.isPassive()) {
			this.m_passiveAbilities.push(castCommandState);
		}else {
			this.m_abilities.push(castCommandState);
		}
	}

	getGold() {
		return this.inventory.getGold();
	}
	
	canCast() {
		if(this.isDead) return false;
		//no abilities are 'casting' or 'channeling'
		for( var a of this.m_abilities ) {
			if( a.isCasting() || a.isChanneling() ) return false;
		}
		return true;
	}

	stopAllCasting() {
		for( var a of this.m_abilities ) {
			a.stopCasting();
		}
	}
	
	Update(ct, dt) {
		if(ct > this.m_lastPassiveUpdate + this.m_passiveUpdatePeriod) {
			this.m_lastPassiveUpdate += this.m_passiveUpdatePeriod;
			for( var a of this.m_passiveAbilities ) {
				if(a.isSelfTargeted()) {
					a.doSelfPassiveHealAndDamage();
				}else {
					a.doAoePassiveHealAndDamage();
				}
			}
		}

		this.eventBus.dispatch("update");
	}
	
	addListener(event, listener) {
		this.eventBus.addListener(event, listener);
	}
	removeListener(event, listener) {
		this.eventBus.removeListener(event, listener);
	}
	dispatch(evt) {
		this.eventBus.dispatch(evt);
	}

	_checkForDeath() {
		if(!this.misDead && this.hp_curr <= 0)
		{
			this.stopAllCasting();
			this.isDead = true;
			this.deadTime = CastCommandTime.Get();
			this.hp_curr = 0;
			this.dispatch({evtName:"dead", entity:this});
			EventBus.game.dispatch({evtName:"entityDeath", entity:this});
		}
	}

	_checkLevelUp() {
			if (this.xp_curr >= this.xp_next)
			{
				this.xp_curr -= this.xp_next;
				this.xp_level++;

				//xp curve
				this.xp_next = Math.floor(Math.pow(1.5, this.xp_level + 5));

				var projectedPlayerHP = 30;
				for(var i=1; i < this.xp_level; i++ ) {
					projectedPlayerHP = ~~(projectedPlayerHP * 1.25);
				}

				var newHP = projectedPlayerHP;
				this.setFullHP(newHP);

				this.dispatch({evtName:"levelUp"});
			}
	}

	//Implement ICastEntity

	getTarget() {
		return this.m_abilityTargets;
	}

	setFullHP( value ) {
		this.hp_base = value;
		this.hp_curr = value;
	}

	// in: string propName, float value, CastEffect effect
	setProperty( propName, value, effect )
	{
		this[propName] = value;

		//cap hp to max
		if(propName == "hp_base") {
			if(value > this.hp_curr) {
				this.hp_curr = this.hp_base;
			}
			this._checkForDeath();
		}
		if(propName == "hp_curr") {
			if(value > this.hp_base) {
				this.hp_curr = this.hp_base;
			}
			this._checkForDeath();
		}

		this.dispatch({evtName:"setProperty", property:propName, value:value});
	}
	// in: string propName, float value, CastEffect effect
	incProperty( propName, value, effect )
	{
		if(this.isDead) return;

		if( propName == "hp_curr" && value < 0) {
			//var isSelfDamage = (effect.getOriginEntity() == this);
			//apply damage redux
			var redux = this.getPassiveDmgRedux();
			if(redux > 0.0) {
				if(redux > 1.0) redux = 1.0;
				value = ~~((1 - redux) * value);
			}
		}

		this[propName] += value;

		if ( propName == "hp_base" )
		{
				if (this.hp_curr > this.hp_base)
				{
						this.hp_curr = this.hp_base; //clamp hp_curr to max

						this._checkForDeath();
				}
		}
		else if (propName == "hp_curr")
		{
			//bounds check hp_curr
			if (this.hp_curr < 0) this.hp_curr = 0;
			if (this.hp_curr > this.hp_base) this.hp_curr = this.hp_base;

			if(effect) {
				if( value > 0 ) {
					this.dispatch({evtName:"healed", effect:effect, value:value});
				}else {
					this.dispatch({evtName:"damaged", effect:effect, value:value});				
				}
			}

			this._checkForDeath();
		}
		else if (propName == "xp_curr" && this.xp_next != 0)
		{
			this._checkLevelUp();
		}
		this.dispatch({evtName:"incProperty", property:propName, value:value});
	}


	// in: string propName, float value, CastEffect effect
	startBuffProperty( propName, value, effect ) {
		console.log("todo: start buff property")
	}
	// in: string propName, float value, CastEffect effect
	endBuffProperty( propName, value, effect ) {
		console.log("todo: end buff property")
	}

	// in: json reaction, CastEffect source
	handleEffectReaction( reaction, source ) {
		this.dispatch({evtName:"doEffectReaction", reaction:reaction, source:source});
	}
	
	// in: string effectEventName, CastEffect source
	handleEffectEvent( effectEventName, source ) {
		EventBus.game.dispatch({evtName:effectEventName, source:source});
	}
	

	//effect is ARRIVING at this entity
	// in: CastEffect effect
	applyEffect( effect ) {
		if( effect.getLifeTime() == 0 )
		{
			console.log("EM("+this.name+") apply effect - instant("+effect.getName()+")");
			effect.startTicks();
		}else {
			switch(effect.getType())
			{
				case CastEffectType.BUFF_STAT:
						console.log("EM("+this.name+") apply effect - BUFF_STAT("+effect.getName()+")");
						this.buffs[effect.getName()] = effect;
						break;
				case CastEffectType.SUPPRESS_STAT:
						console.log("EM("+this.name+") apply effect - SUPPRESS_STAT("+effect.getName()+")");
						this.debuffs[effect.getName()] = effect;
						this.dispatch({evtName:"debuffEffect", effect:effect});
						break;
				case CastEffectType.DAMAGE_STAT:
						console.log("EM("+this.name+") apply effect - DAMAGE_STAT("+effect.getName()+")");
						this.negativeEffects.push(effect);
						break;
				case CastEffectType.HEAL_STAT:
						console.log("EM("+this.name+") apply effect - HEAL_STAT("+effect.getName()+")");
						this.positiveEffects.push(effect);
						break;
				default:
						console.warn("EM("+this.name+") unexpected cast effect type ("+effect.getName()+")");
						break;
			}

			console.log("EM("+this.name+") apply effect - start effect");
			effect.startTicks();
		}
	}
	// in: CastEffect effect
	removeEffect( effect ) {
		switch(effect.getType())
		{
			case CastEffectType.BUFF_STAT:
					delete this.buffs[effect.getName()];
					break;
			case CastEffectType.SUPPRESS_STAT:
					delete this.debuffs[effect.getName()];
					this.dispatch({evtName:"debuffEffectEnd", effect:effect});
					break;
			case CastEffectType.DAMAGE_STAT:
					removeFromArray(this.negativeEffects, effect);
					this.dispatch({evtName:"negativeEffectEnd", effect:effect});
					break;
			case CastEffectType.HEAL_STAT:
					removeFromArray(this.positiveEffects, effect);
					break;
			default:
					console.warn("unexpected cast effect type");
					break;
		}
	}

		// in: string propName
	//float
	getProperty( propName ) { return this[propName]; }


	//	ICastCommandStateDelegate
	onCastStart( ccs ) { this.dispatch({evtName:"castStart", ability:ccs}); }
	onCastComplete( ccs ) { this.dispatch({evtName:"castEnd", ability:ccs}); }
	onChannelStart( ccs ) { this.dispatch({evtName:"channelStart", ability:ccs}); }
	onChannelEnd( ccs ) { this.dispatch({evtName:"channelEnd", ability:ccs}); }
	onCooldownStart( ccs ) { this.dispatch({evtName:"cooldownStart", ability:ccs}); }
	onCooldownEnd( ccs ) { this.dispatch({evtName:"cooldownEnd", ability:ccs}); }

}
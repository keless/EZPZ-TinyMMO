import { NodeView, CreateSimpleProgressBar, Animation, FourPoleAnimation } from '../clientEZPZ.js'
import ResourceProvider from '../../shared/EZPZ/ResourceProvider.js';
import { CastCommandTime } from '../../shared/EZPZ/castengine/CastWorldModel.js';
import {g_abilityCatalog} from '../../shared/data/abilities.js '

class EntityView extends NodeView
{
	constructor( entityModel, isPlayer ) {
		super();
		
		var w = entityModel.bounds.w
		var h = entityModel.bounds.h
		//this.setRect(w, h, "#000000");
		
		this.pEntityModel = entityModel;
		this.ignorePosition = false

		var avatarNode = new NodeView();
		avatarNode.setAnimInstance(this.pEntityModel.animInstance)
		avatarNode.pixelated = true
		avatarNode.scale = 2
		this.addChild(avatarNode)
		this.avatarNode = avatarNode
		
		var name = entityModel.name;
		var lvl = this.pEntityModel.getProperty("xp_level");
		name += " lvl " + lvl;

		/*
		var title = new NodeView();
		title.setLabel( name, "10px Arial", "#FFFFFF" );
		title.pos.setVal(0, -h/4);
		this.addChild(title);
		
		this.hpBar = CreateSimpleProgressBar("#11FF11", "#FF1111", 30, 10);
		this.hpBar.pct = 0.7;
		this.hpBar.setLabel(entityModel.hp_base, "6px Arial", "#FFFFFF");
		this.hpBar.pos.y = 22;
		this.addChild(this.hpBar);

		this.floatHeal = new NodeView();
		this.floatHeal.setLabelWithOutline("", "12px Arial", "#00FF00", "#FFFFFF", 3);
		this.hpBar.addChild(this.floatHeal);

		this.floatText = new NodeView();
		this.floatText.setLabelWithOutline("", "12px Arial", "#FF0000", "#FFFFFF", 3);
		this.hpBar.addChild(this.floatText);
		*/

		this.pEntityModel.addListener("update", this.updateFromModel.bind(this));
		this.pEntityModel.addListener("damaged", this.onDamaged.bind(this));
		this.pEntityModel.addListener("healed", this.onHealed.bind(this));
	}

	Destroy() {
		this.pEntityModel.removeListener("update", this.updateFromModel.bind(this));
		this.pEntityModel.removeListener("damaged", this.onDamaged.bind(this));
		this.pEntityModel.removeListener("healed", this.onHealed.bind(this));
		this.pEntityModel = null;
		this.abilityViews = {};
		super.Destroy();
	}
	
	updateFromModel() {
		//update any dynamic visuals based on model data
		if (this.hpBar) {
			this.hpBar.pct = this.pEntityModel.hp_curr / this.pEntityModel.hp_base;
			this.hpBar.updateLabel( this.pEntityModel.hp_curr + " / " + this.pEntityModel.hp_base);
		}

		if (!this.ignorePosition) {
			this.pos.setVec( this.pEntityModel.pos )
		}
		

		if (this.avatarNode) {
			var ct = CastCommandTime.Get()
			this.avatarNode.setDirection(ct, this.pEntityModel.facing);
		}
	}

	setDirection(ct, dir) {
		if (this.avatarNode) {
			this.avatarNode.setDirection(ct, dir)
		}
	}

	onDamaged(e) {
		var fromEffect = e.effect;
		var amt = e.value;

		this.floatText.updateLabel(fromEffect.getName() + " " + amt);
		//this.floatText.updateLabelStyle("#FF0000");
		this.floatText.pos.setVal(0,this.hpBar.size.y/2);
		var ft = this.floatText;
		this.floatText.clearAllActions();
		this.floatText.tweenPos(1.0, new Vec2D(5, this.hpBar.size.y/2 + 10), function(){
			ft.updateLabel("");
		});
	}

	onHealed(e) {
		var fromEffect = e.effect;
		var amt = e.value;

		this.floatHeal.updateLabel(fromEffect.getName() + " " + amt);
		//this.floatText.updateLabelStyle("#00FF00");
		this.floatHeal.pos.setVal(0,this.hpBar.size.y/2 - 20);
		var ft = this.floatHeal;
		this.floatHeal.clearAllActions();
		this.floatHeal.tweenPos(1.0, new Vec2D(2, this.hpBar.size.y/2 - 35), function(){
			ft.updateLabel("");
		});
	}
	
}

class AbilityView extends NodeView
{
	constructor( abilityModel ) {
		super();
		
		this.progress = 0;
		
		this.m_pAbility = abilityModel;
		
		var w = 50;
		var h = 50;
		
		this.setRect(w, h, "#999999");
		var self = this;

		var abilityId = this.m_pAbility.getModelID();
		var abilityName = abilityId.split(":")[0]
    var abilityIdx = Object.keys(g_abilityCatalog).indexOf(abilityName);
    var icon = new NodeView();
    icon.setSprite("gfx/abilities/abilityIcons.sprite", 1+ abilityIdx);
    icon.scale = 2;
    icon.pixelated = true;
    this.addChild(icon);

		w /= 2;
		h /= 2;
		icon.fnCustomDraw.push(function(gfx, x,y, ct){
			/* width cast anim
			var width = self.progress * (w-2);
			var color = "rgba(5,5,5,0.5)";
			if( self.m_pAbility.isOnCooldown() ) {
				color = "rgba(5,5,5,0.5)";
				width = (w-2) - (self.progress * (w-2));
			}
			
			gfx.drawRectEx(x - (w/2) + (width/2) + 1, y, width, h-2, color);
			*/

			//height cast anim
			var height = self.progress * (h-2);
			var color = "rgba(5,5,5,0.5)";
			if( self.m_pAbility.isOnCooldown() ) {
				color = "rgba(5,5,5,0.5)";
				height = (h-2) - (self.progress * (h-2));
			}
			
			gfx.drawRectEx(x, y - (h/2) + (height/2) + 1, w-2, height, color);
		});

		//this.setLabel(this.m_pAbility.getName(), "18px Arial", "#FFFFFF");		
		
		this.updateFromModel();
	}
	
	updateFromModel() {
		if( this.m_pAbility.isChanneling() ) {
			this.progress = this.m_pAbility.getChannelPct();
		}else if( this.m_pAbility.isOnCooldown() ) {
			this.progress = this.m_pAbility.getCooldownPct();
		}else if( this.m_pAbility.isCasting() ) {
			this.progress = this.m_pAbility.getCastPct();
		}else {
			this.progress = 0.0;
		}
 	}
}

export default EntityView
export { AbilityView, EntityView }
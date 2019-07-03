"use strict"; //ES6

class MapView extends NodeView {
	constructor( currentLocationIdx ) {
		super();
		
		this.locationIdx = currentLocationIdx;

		var screenSize = Graphics.ScreenSize;

		this.imgMap = new NodeView();
		this.imgMap.setImage("gfx/map.png"); //2000x1578

		var dx = Math.max(this.imgMap.size.x - screenSize.x, 0);
		var dy = Math.max(this.imgMap.size.y - screenSize.y, 0);

		var bounds = new Rect2D(0, 0, dx, dy);
		this.imgMap.makeDraggable(bounds);
		this.imgMap.pos.setVal(screenSize.x/2, screenSize.y/2)
		this.addChild(this.imgMap);
		
		this.btnBack = new ButtonView("btnDismissMap", "gfx/ui/btn_blue.sprite", "Back", "14px Arial", "#FFFFFF");
		this.btnBack.pos.setVal(150, 50);
		this.addChild(this.btnBack);

		var fromLoc = g_locations[this.locationIdx];
		var offset = new Vec2D(fromLoc.pos.x, fromLoc.pos.y).scalarMult(-1);
		this.imgMap.pos.addVec(offset);
		bounds.confineVec(this.imgMap.pos);

		this.locBtns = [];

		for(var idx in g_locations) {
			var loc =  g_locations[idx];
			var node = null;
			if( this.locationIdx == idx ) {
				node = new ButtonView( "btnDismissMap", "gfx/ui/btn_white.sprite", loc.name, "14px Arial", "#000000", {idx:idx} );
				//node.disabled = true;
			}else {
				var canReach =  fromLoc.canReach.hasOwnProperty(loc.name);
				if(!canReach) {
					node = new ButtonView( "", "gfx/ui/btn_dark.sprite", loc.name, "14px Arial", "#FFFFFF", {idx:idx} );
					node.alpha = 0.7;
					node.disabled = true;
				}else {
					node = new ButtonView( "mapTouch", "gfx/ui/btn_blue.sprite", loc.name, "14px Arial", "#FFFFFF", {idx:idx} );
					node.alpha = 0.8;
				}
			}
			node.pos.setVal( loc.pos.x, loc.pos.y + 50 );
			this.imgMap.addChild(node);
			this.locBtns.push(node);

			var tier = loc.tier;
			var tierText = "60 Elite";
			if(tier < 7) {
				var max = tier * 10;
				tierText = (max - 9).toString() + " - " + max.toString();
			}


			var lblTier = new NodeView();
			lblTier.setLabelWithOutline(tierText, "12px Arial");
			lblTier.pos.setVal(0, 30);
			node.addChild(lblTier);
		}

		this.SetListener("mapTouch", this.onMapTouch);
	}

	removeAllLocationButtons() {
		for(var i=0; i<this.locBtns.length; i++) {
			this.imgMap.removeChild(this.locBtns[i], true);
		}
		this.locBtns = [];
	}

	onMapTouch(e) {
		var locIdx = e.idx;
		var locTo = g_locations[locIdx];
		var locFrom = g_locations[this.locationIdx];
		var path = [];
		path.push([ locFrom.pos.x, locFrom.pos.y ]);
		path.push.apply(path, locFrom.canReach[locTo.name]);
		path.push([ locTo.pos.x, locTo.pos.y ]);

		this.removeAllLocationButtons();

		this.imgMap.fnCustomDraw.push(function(gfx, x,y, ct){
			//todo: draw line (animate pos)
			for(var i=0;i<path.length-1; i++) {
				var colors = ["#FF0000", "#00FF00", "#0000FF"];
				gfx.ctx.setLineDash([10, 15]);
				gfx.drawLineEx(path[i][0], path[i][1], path[i+1][0], path[i+1][1], colors[i%colors.length], 3);
				gfx.ctx.setLineDash([]);
			}
		});

		var avatar = new NodeView();
		avatar.setCircle(20, "#FF0000");

		this.imgMap.addChild(avatar);
		avatar.pos.setVal(locFrom.pos.x, locFrom.pos.y);

		var speedMult = 2.0;
		var segments = locFrom.canReach[locTo.name].length;
		avatar.setPathTween("pos", segments * speedMult, path, function() {
			EventBus.ui.dispatch({evtName:"btnMapLoc", idx:locIdx});
		});
	}

}
//#include js/framework/EventDispatcher
import { Vec2D, Rect2D } from './Vec2D.js'
import { NodeView } from './NodeView.js'
import EventBus from './EventBus.js'

//random int (min-inclusive, max-inclusive)
export function getRand(min, max) {
  return ~~(Math.random() * (max - min + 1)) + min
}

export function radToDeg( rad ) {
  return (rad *180)/Math.PI
}

//get dictionary length
export function dicLength( dictionary ) {
	return Object.keys(dictionary).length;
}

export function arrayContains( array, element ) {
	if (array.some(function(e){ return e == element; })) return true;
	return false;
}

export function removeFromArray( array, element) {
  var index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
    return true;
  }
  return false;
}

export function isString( obj ) {
	return (typeof obj === 'string' || obj instanceof String);
}

export function isArray( obj ) {
  return obj.constructor === Array || Array.isArray(obj);
}

export function generateUUID(){
    var d = Date.now()
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

//fnCallback = function (data)  where data = null on error
export function getJSON( url, fnCallback ) {
	var request = new XMLHttpRequest();
	
  
  request.ontimeout = function(ev) {
    console.error("getJSON timed out for " + url)
    fnCallback(null);
  }

	request.onload = function() {
		if ((this.status >= 200 && this.status < 400) || (this.status == 0 && this.response)) {
			// Success!
			var data = JSON.parse(this.response);
			fnCallback(data);
		} else {
			console.error("unable to download " + url + " error: " + this.status + " " + this.statusText);
			// We reached our target server, but it returned an error
			fnCallback(null);
		}
	};
  
  
	request.onerror = function() {
		console.error("unable to download " + url + " unable to connect");
		// There was a connection error of some sort
		fnCallback(null);
  };
  
  request.open('GET', url, true);
	request.send();
}

export function CreateScreenShade( alpha ) {
  alpha = alpha || 0.5;
  var screenSize = Graphics.ScreenSize;
  
  var node = new NodeView();
  node.setRect(screenSize.x, screenSize.y, "rgba(0,0,0,"+alpha+")");
  node.pos.setVal(screenSize.x/2, screenSize.y/2);
  node.eatClicks();
  return node;
}

export function CreateSimpleButton( strLabel, strEvt, bus ) 
{
  var area = new Vec2D(100,40);

  if(!bus) {
    bus = EventBus.ui;
  } if(isString(bus)) {
    bus = EventBus.Get(bus);
  }
  
  var btn = new NodeView();
  btn.setRect(area.x, area.y, "rgb(50,150,50)");
  btn.setLabel(strLabel, "16px Arial");
  btn.setClick(function(){
    bus.dispatch({evtName:strEvt, from:btn});
  });

  return btn;
}

export function CreateSimpleImageButton( strLabel, img, strEvt, bus ) {
  
  if(!bus) {
    bus = EventBus.ui;
  } if(isString(bus)) {
    bus = EventBus.Get(bus);
  }

  var btn = new NodeView();
  btn.setImage(img);
  if(strLabel) {
    btn.setLabel(strLabel, "14px Arial");
  }
  btn.setClick(function(){
    bus.dispatch({evtName:strEvt, from:btn});
  });

  return btn;
}

export function CreateSimplePopup( strMsg, strBtnLabel, okEvt, bus ) 
{
  var area = new Vec2D(300, 250);
  
  var pop = new NodeView();
  pop.setRect(area.x, area.y, "rgb(200,200,200)");
  
  var btn = CreateSimpleButton(strBtnLabel, okEvt, bus );
  btn.pos.y = area.y/2;
  pop.addChild(btn);
  
  console.log("button size " + btn.size.x + "," + btn.size.y);
  area.y -= btn.size.y;
  var label = new NodeView();
  label.setLabel( strMsg, "24px Arial", "rgb(0,0,0)", true);
  pop.addChild(label);

  return pop;
}

export function CreateSimpleDismissPopup( strMsg, strBtnLabel ) {
  var evtName = "evt_" + strMsg
  var popup = CreateSimplePopup(strMsg, strBtnLabel, evtName, EventBus.ui)
  var errorPopupDismissal = null
  errorPopupDismissal = function (e) { 
    popup.removeFromParent()
    EventBus.ui.removeListener(evtName, this)
  }
  EventBus.ui.addListener(evtName, errorPopupDismissal)
  return popup
}

//slides up and down
export function CreateSimpleVerticleSlider(w, h, evtName, bus) {
  if(!bus) {
    bus = EventBus.ui;
  } if(isString(bus)) {
    bus = EventBus.Get(bus);
  }

  var slider = new NodeView();
  slider.setRect(10, h, "rgb(128,128,128)");
  slider.pct = 0.0;
  slider.nob = new NodeView();
  slider.nob.setRect(w, 20, "rgb(255,255,255)");
  slider.addChild(slider.nob);

  slider.setClick(function(e,x,y){
    slider.pct = 1 - ((y / (h-20)) + 0.5);
    slider.pct = Math.min(slider.pct, 1);
    slider.pct = Math.max(slider.pct, 0);
    //slider.nob.pos.y = y;
    bus.dispatch({evtName:evtName, pct:slider.pct});
  }, false);

  slider.addCustomDraw(function(gfx, x,y, ct) {
    slider.nob.pos.y = ((1 - slider.pct) * h) - (h/2);
  })

  //todo: support dragging

  return slider;
}

export function CreateSimpleEditBox( strMsg, strDefaultTxt, strBtnLabel, okEvt, strBus ) {
  var area = new Vec2D(300, 250);
  
  var pop = new NodeView();
  pop.setRect(area.x, area.y, "rgb(200,200,200)");
  
  var btn = CreateSimpleButton(strBtnLabel, okEvt, strBus );
  btn.pos.y = area.y/2;
  pop.addChild(btn);
  
  console.log("button size " + btn.size.x + "," + btn.size.y);
  area.y -= btn.size.y;
  var label = new NodeView();
  label.setLabel( strMsg, "24px Arial", "rgb(0,0,0)", true);
  label.pos.y = area.y;
  pop.addChild(label);
  
  //TODO: how to text field
  return pop;
}

//returns a NodeView with a 'pct' value that shows as progress bar 
export function CreateSimpleProgressBar( strColor, strBgColor, w, h ) {
  var area = new Vec2D(w, h);
  var bar = new NodeView();
  bar.pct = 0;
  bar.setRect(w, h, strBgColor);
  
  bar.fnCustomDraw.push(function(gfx, x,y, ct){
    var width = bar.pct * (w-2);
    var color = strColor;

    gfx.drawRectEx(x - (w/2) + (width/2)+ 1, y, width, h-2, color )
  });

  return bar;
}

export class SlidingWindowBuffer extends Array {
  constructor( slidingBufferCapacity = 5, ...items ) {
    super(items)
    this.slidingBufferCapacity = slidingBufferCapacity
  }

  push( obj ) {
    super.push(obj)

    if (this.length > this.slidingBufferCapacity ) {
      this.shift() // remove the oldest object from the buffer
    }
  }

  getLast() {
    if (this.length == 0) {
      return null
    }
    return this[ this.length - 1 ]
  }
}

export default getRand
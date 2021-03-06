import { AppState, NodeView, BaseStateView, Graphics, ResourceProvider, Service, ButtonView, arrayContains, FourPoleAnimation, CreateSimpleDismissPopup } from '../clientEZPZ.js'
import {g_races, g_classes} from '../../shared/data/abilities.js'
import {g_locations} from '../../shared/data/locations.js'
import { ClientProtocol } from '../networking/ClientProtocol.js'
import { ClientGameController } from './ClientGameController.js'

export default class CharacterManagerState extends AppState {
	constructor() { 
		super();
		//this.model = new CharacterManagerStateModel(this);
		this.view = new CharacterSelectStateView(this);	
	}

  gotoCreationView(idx) {
    this.view.Destroy();
    this.view = new CharacterCreationStateView(this, idx);
  }

  gotoSelectView() {
    this.view.Destroy();
    this.view = new CharacterSelectStateView(this);
  }
}

class CharacterSelectStateView extends BaseStateView {
	constructor(state) {
		super();
    var RP = ResourceProvider.instance
		var sprBtnBlue = RP.getSprite("gfx/ui/btn_blue.sprite");
    var screenSize = Graphics.ScreenSize;
		
    this.state = state;

    var lblTitle = new NodeView();
    lblTitle.setLabel("Select Character", "20px Arial", "#000000");
    lblTitle.pos.setVal(screenSize.x/2,100);
    this.rootView.addChild(lblTitle);

    var cols = 3; var rows = 3;
    var xSpace = screenSize.x/(cols+1); 
    var ySpace = 100;

    var xStart = (screenSize.x/2) - ( (cols*xSpace) /2 ) + xSpace/2; 
    var yStart = 300;

    //get list of player owned characters
    var clientGame = ClientGameController.instance
    var playerOwned = clientGame.getEntitiesForCurrentPlayer()

    for(var y=0; y<rows; y++) {
      for(var x=0; x<cols; x++) {
        var idx = (x+y*rows);
        var json = null //sd.load("char"+idx, null);
        if (idx < playerOwned.length) {
          json = playerOwned[idx].toJson()
        }
        var text = "<New>";
        var race = "";
        var isNew = true;
        if(json) {
          text = json["name"];
          race = json["race"];
          isNew = false;
        }

        var btn = new ButtonView("btnChar", sprBtnBlue, text, "12px Arial", "#FFFFFF", {isNew:isNew, idx:idx});
        var bx = xStart + xSpace*x;
        var by = yStart + ySpace*y;
        btn.pos.setVal(bx, by);
        this.rootView.addChild(btn);

        if(!isNew) {
          //show level
          var lblLevel = new NodeView();
          lblLevel.setLabel("Lvl " + json.xp_level, "10px Arial", "#000000" );
          lblLevel.pos.setVal(bx - 30, by + 25);
          this.rootView.addChild(lblLevel);

          //show class
          var lblClass = new NodeView();
          lblClass.setLabel(json.class, "10px Arial", "#000000" );
          lblClass.pos.setVal(bx - 20, by + 35);
          this.rootView.addChild(lblClass);

          //show avatar
          var avatar = new NodeView();
          var avatarAnim = new FourPoleAnimation();
          var rp = ResourceProvider.instance
          var json = rp.getJson("gfx/avatars/avatar.anim");
          avatarAnim.LoadFromJson(json);
          avatarAnim.QuickAttach(race+"_", ".sprite");
          avatar.setAnim(avatarAnim);
          avatar.setDirection(0, 1) //face right
          avatar.pos.setVal(bx - 65, by + 20);
          avatar.scale = 2;
          avatar.pixelated = true;
          this.rootView.addChild(avatar);

          //show character delete button
          var btnDel = new ButtonView("btnDel", "gfx/ui/btn_white_sm.sprite", "X", "12px Arial", "#FF0000", {idx:idx});
          btnDel.pos.setVal(bx + 45, by + 25);
          this.rootView.addChild(btnDel);
        }
      }
    }

		this.SetListener("btnChar", this.onBtnChar);
    this.SetListener("btnDel", this.onBtnDel);
	}

  onBtnDel(e) {
    if(confirm('Are you sure?')) {

      var clientGame = ClientGameController.instance
      var playerOwned = clientGame.getEntitiesForCurrentPlayer()

      console.log("delete character " + e.idx)
      var charId = playerOwned[e.idx].uuid

      var clientProtocol = ClientProtocol.instance
      clientProtocol.requestDeleteCharacter( charId, (data) => {
        console.log("ackRequestDeleteCharacter with data " + data)
  
        if(data.entitiesRemoved) {
          console.log("client rcv removed ${data.removedEntities.length} entities, refresh view" )
          clientGame.removeEntitiesById(data.entitiesRemoved)
        }

        this.state.gotoSelectView();
      })
    }
  }
	
	onBtnChar(e) {
    if(e.isNew) {
      //create new char
      this.state.gotoCreationView(e.idx);
    }else {

      //load char and go to game
      console.log("load known character " + e.idx)

      var clientGame = ClientGameController.instance
      var playerOwned = clientGame.getEntitiesForCurrentPlayer()
      var charId = playerOwned[e.idx].uuid
      var locIdx = 0 //not currently worried about location yet //xxx todo: implement locations

      Service.Get("state").gotoState("battle", {locationIdx:locIdx, controlledEntityId:charId});
    }
	}
}

class CharacterCreationStateView extends BaseStateView {
	constructor(state, idx) {
		super();
    this.state = state;
    this.idx = idx;
    var RP = ResourceProvider.instance
		var sprBtnBlue = RP.getSprite("gfx/ui/btn_blue.sprite");

    var screenSize = Graphics.ScreenSize;
		
		var btnCancel = new ButtonView("btnCancel", sprBtnBlue, "Cancel");
		btnCancel.pos.setVal(150, 150);
		this.rootView.addChild(btnCancel);
		

    this.name = "Leeroy";
    this.selectedClassIdx = 0;
    this.selectedRaceIdx = 0;

    this.lblName = new NodeView();
    this.lblName.setLabel("Name: ", "20px Arial", "#000000");
    this.lblName.pos.setVal(screenSize.x/2 - 50,screenSize.y/2);
    this.rootView.addChild(this.lblName);

    this.inputName = new NodeView();
    this.inputName.setTextInput(200, 30);
    this.inputName.setTextInputValue(this.name);
    this.inputName.pos.setVal(screenSize.x/2,screenSize.y/2 - 25);
    this.rootView.addChild(this.inputName);

    //class selections
    var cw = 100;
    
    var races = g_races;
    var startX  = (screenSize.x/2) - (races.length * cw) / 2 + cw/2;
    this.raceHighlight = new NodeView();
    this.raceHighlight.setRect(50,50, "rgb(255,0,0)");
    this.rootView.addChild(this.raceHighlight);

    this.raceBtns = [];
    for(var i=0; i< races.length; i++ ) {
      var rname = races[i].substr(0,3);
      var btn = new ButtonView("btnRace", "gfx/ui/btn_white_sm.sprite", rname, "12px Arial", "#000000", {idx:i});
      btn.pos.setVal(startX + i*cw, 250);
      this.rootView.addChild(btn);
      this.raceBtns.push(btn);
    }
    this._selectRace(this.selectedRaceIdx);

    var classes = g_classes;
    startX  = (screenSize.x/2) - (classes.length * cw) / 2 + cw/2;
    this.classHighlight = new NodeView();
    this.classHighlight.setRect(50,50, "rgb(255,0,0)");
    this.rootView.addChild(this.classHighlight);
    
    this.classBtns = [];
    for(var i=0; i< classes.length; i++ ) {
      var cname = classes[i].substr(0,3);
      var btn = new ButtonView("btnClass", "gfx/ui/btn_white_sm.sprite", cname, "12px Arial", "#000000", {idx:i});
      btn.pos.setVal(startX + i*cw, 300);
      this.rootView.addChild(btn);
      this.classBtns.push(btn);
    }
    this._selectClass(this.selectedClassIdx);

    var btnCreate = new ButtonView("btnCreate", sprBtnBlue, "Create", "20px Arial");
		btnCreate.pos.setVal(400, 650);
		this.rootView.addChild(btnCreate);
		
		this.SetListener("btnCancel", this.onBtnCancel);
    this.SetListener("btnCreate", this.onBtnCreate);
    this.SetListener("btnRace", this.onBtnRace);
    this.SetListener("btnClass", this.onBtnClass);
	}
	
  onBtnRace(e) {
    this._selectRace(e.idx);
  }
  _selectRace( idx ) {
    if(idx < 0 || idx >= this.raceBtns.length) return;

    this.raceHighlight.pos.setVec(this.raceBtns[idx].pos);
    this.selectedRaceIdx = idx;
  }

  onBtnClass(e) {
    this._selectClass(e.idx);
  }
  _selectClass( idx ) {
    if(idx < 0 || idx >= this.classBtns.length) return;

    this.classHighlight.pos.setVec(this.classBtns[idx].pos);
    this.selectedClassIdx = idx;
  }

	onBtnCancel(e) {
		this.state.gotoSelectView();
	}
  onBtnCreate(e) {

    var name = this.inputName.getTextInputValue();
    var selectedRace = g_races[this.selectedRaceIdx];
    var selectedClass = g_classes[this.selectedClassIdx];

    if (!selectedRace) {
      console.error("invalid race")
      return
    }
    if (!selectedClass) {
      console.error("invalid class")
      return
    }

    /*
    var locIdx = 0
    for(var i=0; i<g_locations.length; i++) {
      var locJson = g_locations[i];
      if("raceStart" in locJson) {
        if( arrayContains(locJson.raceStart, selectedRace)) {
          locIdx = i;
          break;
        }
      }
    }
    */

    var clientProtocol = ClientProtocol.instance
    clientProtocol.requestCreateCharacter( name, selectedRace, selectedClass, (data) => {
      console.log("ackRequestCreateCharacter with data " + data)

      if (data.error) {
        console.log(data.error)
        // show error message on screen
        var popup = CreateSimpleDismissPopup(data.error, "Ok")
        popup.pos.setVec(this.rootView.getVecCenter())
        this.rootView.addChild(popup)

        return
      }

      console.log(data)
      if (data.entities) {
        //world update should have our new character in it
        console.log("got world update after creating char")
        var clientGame = ClientGameController.instance
        clientGame.updateOwnedEntities(data)
      }

      // jump into game once character is created
      if (data.createdCharacterId) {
        var locIdx = -1  //xxx todo: care about locations
        Service.Get("state").gotoState("battle", { locationIdx: locIdx, controlledEntityId: data.createdCharacterId });
      } else {
        Service.Get("state").gotoState("manager")
      }
    })
  }
}
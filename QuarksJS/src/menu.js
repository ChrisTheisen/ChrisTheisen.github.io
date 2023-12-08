function Menu(parent, input, b){
	this.b = b;
	this.d = parent;
	if(!input){return;}
	this.children = {};
	this.current = null;
	
	const m = createUIElement({parent:parent, cssClasses:['menuButtons']});
	const c = createUIElement({parent:parent, cssClasses:['menuContentWrapper']});

	input?.forEach(x => {
		this.children[x.n] = {};
		const btnClass = x.u ? [] : ['hide']
		const btn = createUIElement({type:'button', parent:m, textContent:x.n, cssClasses:btnClass, 
			onclick:()=>{this.current=x.n; this.update(); game.hint();} });
		x.mb = btn;
		const div = createUIElement({parent:c, cssClasses:['hide', 'content']});
		
		if(x.info?.length){
			x.info.forEach(info => createUIElement({type:'p', parent:div, textContent:info, cssClasses:['info']}));
		}
		if(x.intro){
			createUIElement({type:'p', parent:div, textContent:x.intro, cssClasses:['tutorial']})
		}
		
		//special tabs
		switch(x.n){
			case 'Discover': {
				this.renderDiscover(div);
				break;
			}
			case 'Manage': {
				this.renderManage(div);
				break;
			}
			case 'Settings': {
				this.renderSettings(div);
				break;
			}
			case 'Help': {
				this.renderHelp(div);
				break;
			}
			default:{
				if(x?.m){
					//if it has mass it is an individual flavor aka end of the sub-menus
					game.inventory.getInvByFlavor(x).renderCreate(div);
				}
				break;
			}
		}
		this.children[x.n] = new Menu(div, x.c, btn);
	});
}
Menu.prototype.gotoNode = function(input, parent = null){
	if(Object.keys(this.children).includes(input)){
		this.current = input;
		this.update();
		return true;
	}
	for(let [key, value] of Object.entries(this.children)){
		if(value?.gotoNode(input, this)){
			this.current = key;
			this.update();
			return true;
		}
	}
	
	return false;
}

Menu.prototype.update = function(){
	if(!this.children){return;}
	Object.values(this.children).forEach(x => {
		x.b.classList.remove('selected');
		x.d.classList.add('hide');
	});
	if(!this.current){return;}
	
	this.children[this.current].b.classList.add('selected');
	this.children[this.current].d.classList.remove('hide');
	
	this.children[this.current]?.update();//needed for gotoLeaf to work.

	game.inventory.update();//updates the content quick when tab changes.
}
Menu.prototype.updateTable = function(){
	const table = getUIElement('table');
	const newTable = [];
	const names = game.table.map(x => x.f.n).sort();
	newTable.push(createUIElement({type:'h3', textContent:'Matter Mutator'}));
	names.forEach(x => {
		const item = createUIElement({cssClasses:['tableItem', 'nowrap', 'row']});
		
		createUIElement({type:'span', parent:item, textContent:x, cssClasses:['cell']});
		createUIElement({type:'button', parent: item, cssClasses:['circleButton', 'del', 'cell'], textContent:'--', title:'Remove From Table',
			onclick:() => {
				for(let i=0;i<game.table.length;i++){
					if(game.table[i].f.n === x){
						game.table.splice(i,1);
						game.menu.updateTable();
						return;
					}
				}
			}
		});
		
		newTable.push(item);
	});
	
	table.replaceChildren(...newTable);
}

Menu.prototype.updateResults = function(input){
	const table = getUIElement('table');
	const newTable = [];

	newTable.push(createUIElement({type:'h3', textContent:'Scan Results'}));
	input.forEach(x => {
		newTable.push(createUIElement({textContent:x.f?.n??x}));
	});
	
	table.replaceChildren(...newTable);
}

Menu.prototype.renderDiscover = function(parent){
	
	const hint = createUIElement({parent:parent, cssClasses:['hintZone', 'center']});
	createUIElement({type:'button', id:'btnHint', textContent:'Generate Discoverable Recipe', parent:hint, style:{marginLeft:'15px'},
		onclick:()=> setElementText(hout, generateDiscoverHint())});
	const hout = createUIElement({type:'span',parent:hint});
	
	const filter = createUIElement({parent:parent, cssClasses:['filterWrapper']});
	
	createUIElement({type:'label', parent:filter, textContent:'Filter: ', attr:{htmlFor:'discoverFilter'}});
	const search = createUIElement({type:'input', parent:filter, id:'discoverFilter', attr:{type:'search', list:'filterSuggestions'}});

	addUIEventListener(search, (e) => {
		game.settings.d.s = search.value.toLowerCase(); 
		game.inventory.update();
		}, 'keyup');
	
	createUIElement({type:'label', parent:filter, textContent:'Only in stock: ', style:{paddingLeft:'15px'}, attr:{htmlFor:'filterChk'}});
	createUIElement({type:'input', parent:filter, title:'Filter out of stock',
		attr:{type:'checkbox'}, id:'filterChk',
		onclick:(e) => {
			game.settings.d.o = !game.settings.d.o;
			game.inventory.update();
		}});
	
	const w = createUIElement({parent:parent, cssClasses:['discover', 'center']});

	createUIElement({type:'button', id:'btnScan', textContent:'Scan', parent:w, style:{marginRight:'75px', float:'right'},
		onclick:()=>{
			const results = findLockedFlavorsByComponents(game.table.map(x => x.f));
			
			game.table.length = 0;
			if(results.length){
				results.forEach(x => {
					game.inventory.getInvByFlavor(x.f).unlock();
				});
				this.updateResults(results);
			}
			else{
				this.updateResults(['No new items discovered']);
			}
		}});
	
	const bags = createUIElement({parent:w, cssClasses:['cell'], style:{minWidth:'300px'}});
	game.inventory.renderDiscover(bags);
	
	const table = createUIElement({id:'table', cssClasses:['table', 'cell'], parent:w});
	createUIElement({type:'h3', parent:table, textContent:'Matter Mutator'});
}

Menu.prototype.renderManage = function(parent){
	const filter = createUIElement({parent:parent, cssClasses:['filterWrapper']});
	
	createUIElement({type:'label', parent:filter, textContent:'Filter: ', attr:{htmlFor:'manageFilter'}});
	const search = createUIElement({type:'input', parent:filter, id:'manageFilter', attr:{type:'search', list:'filterSuggestions'}});

	addUIEventListener(search, (e) => {
		game.settings.m.s = search.value.toLowerCase(); 
		game.inventory.update();
		}, 'keyup');

	const select = createUIElement({type:'select', parent:filter});
	createUIElement({type:'option', parent:select, textContent:'Show All', attr:{value:'a'}});
	createUIElement({type:'option', parent:select, textContent:'Show Deficit', attr:{value:'d'}});
	createUIElement({type:'option', parent:select, textContent:'Show Balanced', attr:{value:'b'}});
	createUIElement({type:'option', parent:select, textContent:'Show Surplus', attr:{value:'s'}});
	
	addUIEventListener(select, (e) => {
			game.settings.m.d = select.value;
			game.inventory.update();
		}, 'change');
	
	game.inventory.renderManage(createUIElement({parent:parent, cssClasses:['manage', 'center']}));
}

Menu.prototype.renderHelp = function(parent){
	help.forEach(x => {
		const topic = createUIElement({parent:parent, cssClasses:['helpTopic'], textContent:x.t});
		const content = createUIElement({parent:parent, cssClasses:['helpContent', 'hide']});
		addUIEventListener(topic, () => content.classList.toggle('hide'));
		
		x.c.forEach(y => {
			createUIElement({parent:content, cssClasses:['helpDiv'], textContent:y});
		});
	
	});
}

Menu.prototype.renderSettings = function(parent){
	createUIElement({type:'button', parent:parent, textContent:'Hide "Helpful Tips" with a green border.', 
		cssClasses:['tutorial'], style:{marginLeft:'15px'},
		onclick:() => Array.from(document.getElementsByClassName('tutorial')).forEach(x => x.classList.add('hide'))
	});

	const i = createUIElement({parent:parent, cssClasses:['settingsRow']});
	createUIElement({type:'label', parent:i, textContent:'Show Info', attr:{htmlFor:'chkSettingsI'}});
	createUIElement({type:'input', parent:i, title:'Toggle Info Snippets',
		attr:{type:'checkbox', checked:game.settings.i}, id:'chkSettingsI',
		onclick:() => {
			game.settings.i = !game.settings.i
			Array.from(document.getElementsByClassName('info'))
				.forEach(x => x.classList.toggle('hide', !game.settings.i) );
		}});

	const u = createUIElement({parent:parent, cssClasses:['settingsRow']});
	createUIElement({type:'label', parent:u, textContent:'Show Used-In Spoiler Warning', attr:{htmlFor:'chkSettingsU'}});
	createUIElement({type:'input', parent:u, title:'Show Used-In Warning',
		attr:{type:'checkbox', checked:game.settings.u}, id:'chkSettingsU',
		onclick:() => game.settings.u = !game.settings.u});

	const c = createUIElement({parent:parent, cssClasses:['settingsRow']});
	createUIElement({type:'label', parent:c, textContent:'Cheater Level:', attr:{htmlFor:'numSettingsc'}});
	const num = createUIElement({type:'input', parent:c, title:'Cheater Level (-1 to disable)',
		attr:{type:'number', min:-1, max:7, value:game.settings.c}, id:'numSettingsC'});
	addUIEventListener(num, (e) => {
		game.settings.c = parseInt(e.target.value);
		game.inventory.update();
	}, 'change');

	createUIElement({type: 'hr', parent: parent});

	const l = createUIElement({parent: parent, cssClasses:['settingsRow']})
	createUIElement({type: 'span', parent:l, textContent:'Last save at: '});
	createUIElement({type: 'span', parent:l, id:'lastSave'});

	const m = createUIElement({parent: parent, cssClasses:['settingsRow']})
	const n = createUIElement({type: 'textarea', parent: m, id:'txtSave', attr:{rows:'10', cols:'80', disabled:'true'}})
	createUIElement({parent:m, textContent:'Input Load Data:'});
	const o = createUIElement({type: 'textarea', parent: m, id:'txtLoad', attr:{rows:'10', cols:'80'}})
	createUIElement({type:'button', parent:createUIElement({parent: parent, cssClasses:['settingsRow']}), textContent:'Load Data',
		style:{marginLeft:'15px'}, onclick:() => loadSaveData()
	});

	createUIElement({type: 'hr', parent: parent});

	const s = createUIElement({parent:parent, cssClasses:['settingsRow']});
	createUIElement({type:'button', parent:s, textContent:'Restore Default Settings', 
		style:{marginLeft:'15px'}, onclick:() => resetSettings()
	});

	const z = createUIElement({parent:parent, cssClasses:['settingsRow']});
	createUIElement({type:'button', parent:z, textContent:'HARD RESET', 
		style:{marginLeft:'15px'}, onclick:() => { if(window.confirm("Really lose all data and reset the whole game?")){hardReset();} }
	});

}
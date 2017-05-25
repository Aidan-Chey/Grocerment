(function() {
	'use strict';

	var app = {
		isLoading: true
		,activePane: null
		,title: 'Gocerment'
		,headerMenuState: false
		,spinner: document.querySelector('.loader')
		,container: document.getElementById('main-wrapper')
		,header: document.getElementById('main-header')
		,header_title: document.getElementById('header-title')
		,header_menu: document.getElementById('header-menu')
		,footer: document.getElementById('main-footer')
		,panes: {
			wishlist: ''
			,inventory: ''
			,item: generate_item
		}
		,items:[]
		,touchDuration: 200
		,touchTimer: null
		,measurments: [
			{ 'uid': 0, 'name':'count' }
			,{ 'uid': 1, 'name':'kilogram', 'abbreviation':'kg' }
			,{ 'uid': 2, 'name':'litre', 'abbreviation':'l' }
		]
		,itemObtained: {
			true: '/images/tick.svg'
			,false: '/images/square.svg'
		}
		,online: false
		,account: {}
	}


	 /*****************************************************************************
	*
	* Event listeners for UI elements
	*
	****************************************************************************/
	//Apply on click to header refresh button
	document.getElementById('header-refresh').addEventListener( 'click', function() {
		app.server_sync();
	}, false );

	//Apply onclick listeners to header burger
	document.getElementById('header-burger').addEventListener( 'click', function (event) {
		app.toggle_header_menu();
		event.stopPropagation();
	}, false );

	//Apply onclick listeners to header menu items
	var headerMenuItems = app.header_menu.children;
	for (var i = headerMenuItems.length - 1; i >= 0; i--) {
		headerMenuItems[i].addEventListener( 'click', function(event) {
			app.header_menu_item_click(event);
			event.stopPropagation();
		}, false );
	}


	/*****************************************************************************
	*
	* Methods to update/refresh the UI
	*
	****************************************************************************/

	//Refreshes active pane
	app.refresh_pane = (arg = null) => {
		app.toggle_loading(true);
		app.container.innerHTML = '';
		app.footer.innerHTML = '';

		if(location.hash && app.activePane == null) app.activePane = location.hash.substring(1);		//If no active pane, use the location hash in the URI

		if( Object.keys(app.panes).indexOf(app.activePane) < 0 ) app.activePane = 'wishlist';		//Check if active pane is in the list of available panes in the main app.panes object; if not change it to wishlist

		if( app.activePane == 'item' ) app.panes.item(app,arg);
		else app.generate_list();

		location.hash = '#' + app.activePane;		//Change the location hash in the URI to the activePane

		app.toggle_loading(false);
	}

	app.clearCustomError = (event) => { event.target.setCustomValidity(''); };

	//Handles clicks on the header menu items
	app.header_menu_item_click = ( event ) => {
		app.toggle_header_menu();

		app.activePane = event.target.dataset.url;
		app.refresh_pane();
	}

	//Menu click off
	app.header_menu_click_detect = ( event ) => {
		var target = event.target;
		var menu = document.getElementById('header-menu');
		var menu_input = document.getElementById('header-menu-input');

		//Figure out if the clicked element has parent of header-menu
		if(target != menu && target.parentNode != menu && target != menu_input){
			app.toggle_header_menu();
		}
	}

	//Toggles the header menu (show / hide)
	app.toggle_header_menu = () => {
		if ( app.headerMenuState ) {
			app.header_menu.setAttribute('hidden','');
			app.headerMenuState = false;
			document.removeEventListener( 'click', app.header_menu_click_detect, false );
		} else {
			app.header_menu.removeAttribute('hidden');
			app.headerMenuState = true;
			document.addEventListener( 'click', app.header_menu_click_detect, false );
		}
	}

	app.toggle_loading = ( state ) => {
		if(app.isLoading == state) return;		//Don't change loading state if already correct
		app.spinner.hidden = !state;
		app.container.hidden = state;
		app.isLoading = state;

		app.adjust_title();
	}

	app.adjust_title = () => {
		if(app.isLoading || app.activePane == null) {
			app.header_title.innerHTML = app.title;
			document.title = app.title;
		} else {
			app.header_title.innerHTML = app.activePane.capitalizeFirstLetter();
			document.title = app.activePane.capitalizeFirstLetter() + ' - ' + app.title;
		}
	}

	app.item_down =(event) => {
		if( typeof event.buttons != 'undefined' ) {
			if( event.type != 'mousedown' || event.button != 0 || event.buttons != 1 ) return;
		} else if ( typeof event.touches != 'undefined' ) {
			if( event.type != 'touchstart' || event.touches.length != 1 ) return;
		} else return;

		event.stopPropagation();

		app.touchTimer = setTimeout( function () {
			app.list_context(event.target);
			app.touchTimer = null
		}, app.touchDuration );
	}


	/*****************************************************************************
	*
	* Methods to store data
	*
	****************************************************************************/
	app.storageSend = ( type, key = null, input = null, arg = null ) => {
		//General input validation
		if( ['session','local','server'].indexOf(type) == -1 ) { console.error('Data storage call error, none or an invalid type specified:',type); return; }
		if( key == null || key == '' ) reject('Data storage call error, Empty or no key specified:',key);
		//Empty input is fine, it removes the entry if null or empty string
		//Arguments handled by server storage
		var promise = new Promise( function(resolve, reject) {
			switch	(type) {
				case 'session':		//Data storage
					//Session storage validation
					if( !app.storageAvailable('sessionStorage') ) reject('Session storage not available');

					if( input == null || input == '' ) resolve( sessionStorage.removeItem(key) );
					else resolve( sessionStorage.setItem(key, input) );
					break;
				case 'local':
					//Local storage validation
					if( !app.storageAvailable('localStorage') ) reject('Local storage not available');

					if(input == null || input == '') resolve( localStorage.removeItem(key) );
					else resolve( localStorage.setItem(key, input) );
					break;
			}
		} );
		//Storage success state
		promise.then( function() { /*console.info('Data successfully stored in:',type+' | key:',key);*/ } );
		//Storage failure state
		promise.catch( function( reason, extra = '' ) { console.error('Failed to store data in ' + type + ' storage:',reason,extra); } );
	}

	app.storageRetrieveItems = () => {
		var promise = new Promise( function( resolve, reject ) {
			//Local storage validation
			if( !app.storageAvailable('localStorage') ) reject('Local storage not available');

			resolve( localStorage.getItem( 'items' ) );
		} );
		//Retrieval success state
		promise.then( function( output ) { if( output ) app.items = JSON.parse( output ); app.fill_list(); } );
		//Retrieval failure state
		promise.catch( function( reason, extra = '' ) { console.error(`Failed to retrieve items from local storage:`, reason, extra ); } );
	}

	app.storageRetrieveAccount = () => {
		var promise = new Promise( function( resolve, reject ) {
			//Local storage validation
			if( !app.storageAvailable('localStorage') ) reject('Local storage not available');

			resolve( localStorage.getItem( 'account' ) );
		} );
		//Retrieval success state
		promise.then( function( output ) { if( output ) app.account = JSON.parse( output ); } );
		//Retrieval failure state
		promise.catch( function( reason, extra = '' ) { console.error(`Failed to retrieve server login from local storage (you will need to reenter it upon sync):`, reason, extra ); } );
	}

	app.save_account = () => { app.storageSend( 'local', 'account', JSON.stringify( app.account ) ); }

	//Attempts to sync lists in memory with server storage
	app.server_sync = () => {
		let syncHeaders = new Headers;
		let syncBody = new FormData;

		navigator.serviceWorker.getRegistrations().then(function(registrations) {
			registrations.forEach(function(registration) {
				registration.update();
			});
		});

		document.getElementById('header-refresh').setAttribute('syncing','');

		if ( !app.account.username ) app.account.username = window.prompt( 'Enter your server login username' );
		if ( !app.account.password ) app.account.password = window.prompt( 'Enter your server login password' );

		if ( !app.account.username || !app.account.password ) {
			window.alert( 'Unable to sync with server; username and/or password not specified' );
			document.getElementById('header-refresh').removeAttribute('syncing');
			return;
		}

		syncBody.append( 'username', app.account.username );
		syncBody.append( 'password', app.account.password );
		syncBody.append( 'items', JSON.stringify( app.items ) );

		let syncInit = {
			method: 'POST'
			,headers: syncHeaders
			,body: syncBody
			,mode: 'same-origin'
			,cache: 'no-store'
		};

		return fetch('/ajax/list-sync/',syncInit)
			.then( function(response) {app.items
				if(response.ok) {
					let contentType = response.headers.get("content-type");
					if(contentType && contentType.indexOf("application/json") !== -1) {
						return response.json().then(function(json) {
							if( json.success ) {
								app.items = json.output;
								app.sort_items();
								app.save_items();
								app.save_account();
								app.refresh_pane();
							} else {
								console.error( 'An error occured while syncing with the server',' | ', json.message,' | ', json.error );
								app.account = {};
								window.alert( 'Couldn\'t sync local items with server.\nWere the login details correct?' );
							}
							document.getElementById('header-refresh').removeAttribute('syncing');
						});
					} else {
						response.text().then( function(text) {
							console.error('Server sync response was not in JSON, response: ',text);
							document.getElementById('header-refresh').removeAttribute('syncing');
						} );
					}
				}else{
					console.error('Fetch request was not ok: ',response);
					document.getElementById('header-refresh').removeAttribute('syncing');
				}
			} )
			.catch( function(error) {
				console.error('Fetch request returned in error: ',error);
				document.getElementById('header-refresh').removeAttribute('syncing');
			} );
	};

	//Saves current sate of specified lists
	//saves all if none specified
	app.save_items = () => { app.storageSend( 'local', 'items', JSON.stringify( app.items ) ); }

	//Converts an item into a JSON string or back.
	app.convert_item = (input) => {
		if ( isJson(input) ) return JSON.parse(input);
		else return JSON.stringify(input);
	}

	//Checks if the local or session storage is available to be used.
	app.storageAvailable = (type) => {
		try {
			let storage = window[type],
				x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		}
		catch(e) { return false; }
	}

	//Checks if the app is online and alters the sync button depending on state
	app.appOnline = () => {
		let status = navigator.onLine;
		app.toggle_sync(status);
		app.online = status;
		return status;
	}

	//Enables or Disables the sync button depeneding on state
	app.toggle_sync = (state = false) => {
		let sync_button = document.getElementById('header-refresh');
		if( state ) sync_button.removeAttribute('disabled');
		else sync_button.setAttribute('disabled',true);
	}

	//Template for a new item, outputs object with defaults, unless parameters specified
	app.new_item = ( name = 'Un-Named Item', quantity = 1, type = 'count', list = 'wishlist', obtained = false ) => {
		return {
			'name':name
			,'quantity':quantity
			,'type':type
			,'list':list
			,'obtained':obtained
			,'last_change':Math.floor(Date.now() / 1000)		//Epoch timestamp in seconds
			,'last_sync':0
		}
	}

	app.move_item = ( to, item ) => {
		item.list = to;
		app.save_items();
	}

	//Returns an array of items from the specified
	app.retrieveList = ( listName ) => {
		let items = [];
		for ( let item of app.items ) { if ( item.list == listName ) items.push(item); }
		return items;
	}

	//Sorts items in their array based on their
	app.sort_items = () => {
		try {
			let lists = {};
			let sortedList = [];

			for ( let item of app.items ) {
				if( !lists[item.list] ) lists[item.list] = [];

				lists[item.list].push(item);
			}

			for ( let list in lists ) {
				lists[list].sort( function(a,b){
					if( a.obtained && !b.obtained ) {
						switch ( a.list ) {
							case 'inventory': return -1;
							case 'wishlist': return 1;
						}
					} else if( !a.obtained && b.obtained ){
						switch ( a.list ) {
							case 'inventory': return 1;
							case 'wishlist': return -1;
						}
					} else if( a.obtained == b.obtained ) return a.name.localeCompare(b.name);
					else return 0;
				} );
				sortedList = sortedList.concat(lists[list]);
			}

			app.items = sortedList;

		} catch (e) {
			console.error('Item sort resulted in error: ',e);
		}
	}

	//Move HTML item element to new position in list
	app.reposition_item = ( element ) => {
		let listContainer = app.container.querySelector( 'ul.'+app.activePane );
		let item = app[app.activePane+'_reference'][element.id];
		let newIndex = null;
		let oldIndex = 0;

		for ( let itemIndex in app.items ) { if( app.items[itemIndex] === item ) newIndex = itemIndex; }		//Find item's new index in the object array of items (after sorting)

		let indexTest = element;
		while ( ( indexTest = indexTest.previousSibling ) != null ) oldIndex++;		//Find element's original position by counting previous siblings in the parent

		//Move item in parent HTML
		listContainer.removeChild(element);		//Needed to remove from old position first to help with postion logic
		if( oldIndex > newIndex ) listContainer.insertBefore( element, listContainer.children[newIndex] );
		else if( oldIndex < newIndex ) listContainer.insertBefore( element, listContainer.children[newIndex++] );
	}

	app.add_list_element = ( item ) => {
		let list = app.activePane;
		let quantity = item.quantity;
		let type = item.type;
		let name = item.name;
		let multiplySymbol = 'X';
		let checked = ( item.obtained === 1 || item.obtained === true || item.obtained === "true" || item.obtained === "1" ? true : false );

		if( name.length < 1 ) { console.error( 'Could not add ' + list + ' item, no name specified' ); return; }
		if( quantity < 0 ) { console.error( 'Could not add ' + list + ' item, quantity is negative' ); return; }

		let list_element = document.querySelector( 'ul.' + list )
		if( !list_element ) return;

		let reference_list = app[list + '_reference'];
		let item_id = list + (Object.keys(reference_list).length);

		if( document.getElementById(item_id) ) return;

		let item_element = document.createElement('li');
		item_element.id = item_id;
		list_element.appendChild(item_element);
		reference_list[item_id] = item;

		let wrapping_div = document.createElement('div');
		wrapping_div.className = 'item-wrapper';
		item_element.appendChild(wrapping_div);

		let item_name = document.createElement('span');
		item_name.className = 'item-name';
		item_name.innerHTML = name;
		wrapping_div.appendChild(item_name);

		let item_quantity= document.createElement('span');
		item_quantity.className = 'item-quantity';
		if ( type == 0 ) {
			if( quantity > 1 ) item_quantity.innerHTML = `${multiplySymbol} ${quantity}`;
		} else {
			item_quantity.innerHTML = `${quantity} ${app.measurments[type].abbreviation}` + ( quantity > 1 ? 's' : '' );
		}
		wrapping_div.appendChild(item_quantity);

		let item_checked= document.createElement('img');
		item_checked.className = 'item-checked icon noselect';
		item_checked.src = app.itemObtained[checked];
		item_element.appendChild(item_checked);

		item_element.addEventListener( 'mousedown', app.item_down ,false );
		item_element.addEventListener( 'mouseup', app.item_up ,false );

		item_element.addEventListener( 'touchstart', app.item_down ,false );
		item_element.addEventListener( 'touchend', app.item_up ,false );

		item_element.addEventListener( 'touchmove', app.item_move, false );

		return item_element;
	}

	app.fill_list = () => {
		if ( app.container & app.container.children.length > 0 ) return;

		if( app.items.length < 1 ) return;

		for ( let item of app.items ) {
			if( item.list == app.activePane ) app.add_list_element( item );
		}
	}

	app.list_context = (element) => {
		let item = app[app.activePane+'_reference'][element.id];
		let container = app.create_overlay();
		let contextMenu = app.create_contextMenu(container);

		let removeItemButton = document.createElement('div');
		contextMenu.appendChild(removeItemButton);
		removeItemButton.id = 'list_context_remove';

		removeItemButton.innerHTML = 'Archive Item';

		let editItemButton = document.createElement('div');
		contextMenu.appendChild(editItemButton);
		editItemButton.id = 'list_context_edit';
		editItemButton.innerHTML = 'Edit Item';

		let cancelItemButton = document.createElement('div');
		contextMenu.appendChild(cancelItemButton);
		cancelItemButton.id = 'list_context_cancel';

		cancelItemButton.innerHTML = 'Cancel';

		setTimeout( function () {
			container.addEventListener( 'click', function(event) {
				document.body.removeChild(container);
				event.stopPropagation();
			}, false);

			removeItemButton.addEventListener( 'click', function(event) {
				event.stopPropagation();
				app.archive_list_item(element,app.activePane);
				document.body.removeChild(container);
			}, false);

			editItemButton.addEventListener( 'click', function(event) {
				event.stopPropagation();
				app.edit_item(item,app.activePane);
				document.body.removeChild(container);
			}, false);

			cancelItemButton.addEventListener( 'click', function(event) {
				event.stopPropagation();
				document.body.removeChild(container);
			}, false);
		}, 500 );
	}

	app.create_overlay = () => {
		let containerId = 'context-menu-background';
		let container = document.getElementById(containerId);

		if( container ) {
			document.body.removeChild(container);
			return;
		}

		container = document.createElement('div');
		document.body.appendChild(container);
		container.id = containerId;
		container.className = 'noselect';

		return container;
	}

	app.create_contextMenu = (container) => {
		let contextMenu = document.createElement('div');
		container.appendChild(contextMenu);
		contextMenu.id = 'context-menu';

		return contextMenu;
	}

	app.obtained_toggle = ( element ) => {
		let item = app[app.activePane+'_reference'][element.id];
		let newState = !( item.obtained === 1 || item.obtained === true || item.obtained === "true" || item.obtained === "1" ? true : false );
		item.obtained = newState;
		item.last_change = Math.floor(Date.now() / 1000);

		let stateSymbol = element.querySelector('.item-checked');
		stateSymbol.src = app.itemObtained[newState];

		app.sort_items();
		app.reposition_item(element);
		app.save_items();
	}

	app.item_up = (event) => {
		if( typeof event.buttons != 'undefined' ) {
			if( event.type != 'mouseup' || event.button != 0 ) return;
		} else if ( typeof event.touches != 'undefined' ) {
			if( event.type != 'touchend' ) return;
		} else return;

		if ( !app.touchTimer ) return;

		event.preventDefault();
		event.stopPropagation();

		clearTimeout(app.touchTimer);
		app.touchTimer = null;

		app.obtained_toggle(event.target);
	 }

	app.item_move = (event) => {
		if( app.touchTimer ) {
			clearTimeout(app.touchTimer);
			app.touchTimer = null;
		}
	}

	app.edit_item = (item,listName) => {
		app.activePane = 'item';
		app.refresh_pane( { list:listName, item:item } );
	}

	app.archive_list_item = ( element, list ) => {
		let wishlistContainer = app.container.querySelector('.'+list);
		let item = app[list + '_reference'][element.id];
		item.last_change = Math.floor( Date.now() / 1000 );
		app.move_item( 'archive', item );
		wishlistContainer.removeChild( element );
	}

	//Moves items that meet criteria to the other list
	app.checkout = () => {
		switch ( app.activePane ) {
			case 'inventory':
				var confirmation = window.confirm('Are you sure you want to move non-checked items to your Wishlist?');
				var newList = 'wishlist';
				break;
			case 'wishlist':
			default:
				var confirmation = window.confirm('Are you sure you want to move checked items to your Inventory?');
				var newList = 'inventory';
		}

		if( !confirmation ) {
			console.log('Checkout canceled by user or confirmation interface blocked by browser');
			return;
		}

		for( let item of app.items ) {
			let checked = ( item.obtained === 1 || item.obtained === true || item.obtained === "true" || item.obtained === "1" ? true : false );
			if( item.list != app.activePane ) continue;
			if( app.activePane == 'inventory' && checked ) continue;
			if( app.activePane == 'wishlist' && !checked ) continue;

			item.list = newList;
			item.last_change = Math.floor(Date.now() / 1000);
		}

		app.sort_items();
		app.save_items();

		app.activePane = newList;
		app.refresh_pane();
	}

	app.generate_list = () => {
		app[app.activePane+'_reference'] = {};

		app.generate_footer();

		var list_element = document.createElement('ul');
		app.container.appendChild(list_element);
		list_element.className = app.activePane;

		app.fill_list();
	}

	app.generate_footer = () => {
		var bodyFooter = document.querySelector("footer");

		var quickAdditem = document.createElement('img');
		bodyFooter.appendChild(quickAdditem);
		quickAdditem.id = "footer-addItem";
		quickAdditem.src = "images/add.svg";
		quickAdditem.className = "icon noselect";
		quickAdditem.title = 'Add Item';
		quickAdditem.addEventListener( 'click', function(event) {
			let listName = app.activePane;
			event.stopPropagation();
			app.activePane = 'item';
			app.refresh_pane( { list:listName} );
		}, false );

		var checkoutButton = document.createElement('img');
		bodyFooter.appendChild(checkoutButton);
		checkoutButton.id = "footer-checkoutItems";
		checkoutButton.src = "images/cart.svg";
		checkoutButton.className = "icon noselect";
		switch (app.activePane) {
			case 'inventory': checkoutButton.title = 'Add to Wishlist'; break;
			case 'wishlist': checkoutButton.title = 'Checkout'; break;
		}
		checkoutButton.addEventListener( 'click', function(event) {
			event.stopPropagation();
			app.checkout();
		}, false );
	}

	app.messageHandler = (input) => {
		switch (input.purpose) {
			case 'newUpdate':
				if(input.state) {
					window.alert('A new update has been downloaded!\nThe application will now refresh to load new files');
					window.reload(false);
				}
				break;
			default:
				console.error('Unknown message purpose recieved',input);
		}
	}

	if('serviceWorker' in navigator) {
		if('caches' in window) {
			console.info('Registering app cache...');
			navigator.serviceWorker
				.register('/cache-app.js')
				.then( function(registration) {
					console.info('App cache registered');
				}, function () {
					console.info('App cache registration failed.');
				});
		} else {
			console.error('Cache storage is not supported.');
		}
	} else {
		console.error('Service workers is not supported.');
	}

	navigator.serviceWorker.onmessage = function(event) {
		switch (event.data) {
			case 'update_waiting':
				console.info('New files found, please refresh the page');
				alert('An new version is ready!\nPage will now refresh to use updated files...');
				document.location.reload();
				break;
			default:
				console.error('Unknown message from client: ', event.data);
		}
	};

	app.appOnline();
	setInterval(function(){ app.appOnline(); }, 5000);

	app.storageRetrieveItems();
	app.storageRetrieveAccount();

	app.refresh_pane();

	console.debug(app);
} )();


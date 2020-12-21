function generate_item (app, arg = {}) {
	var item = (arg ? arg.item : null );
	var list = (arg ? arg.list : null );

	app.initiate_scan = (event) => {
		console.log('scan initiated');
		console.debug(event.target);
	}

	app.submit_edit = (event) => {
		event.stopPropagation();
		event.preventDefault();

		let return_to_list = () => {
			app.activePane = ( list == 'inventory' ? 'inventory' : 'wishlist' );
			app.refresh_pane();
		}

		let update_list_item = () => {
			item.name = formElements.name.value;
			item.quantity = formElements.quantity.value;
			item.type = formElements.type.value;
			item.last_change = Math.floor(Date.now() / 1000);
			app.save_items();
			return_to_list();
		}

		let insert_list_item = () => {
			app.items.push( app.new_item( formElements.name.value, formElements.quantity.value, formElements.type.value, list, list == 'inventory' ) );

			app.sort_items();
			app.save_items();
			return_to_list();
		}

		let formElements = event.target.elements;

		if ( formElements.type.value == 'Unit' ) {
			formElement.setCustomValidity( 'Please select an item in the list.' );
			form.reportValidity();
		}

		if( item ) update_list_item();
		else insert_list_item();
	}

	app.container.innerHTML = '';

	let editContainer = document.createElement('div');
	editContainer.id = 'item-edit';
	app.container.appendChild(editContainer);

	//Create the interface
	let scanItem = document.createElement('div');
	editContainer.appendChild(scanItem);
	scanItem.innerHTML = 'Scan Item';
	scanItem.className = 'noselect';
	scanItem.addEventListener( 'click', app.initiate_scan, false );

	editContainer.appendChild(document.createElement('hr'));

	let editFields = document.createElement('form');
	editContainer.appendChild(editFields);
	editFields.id = 'item-form';
	editFields.addEventListener( 'submit', app.submit_edit, false );

	let itemName = document.createElement('input');
	editFields.appendChild(itemName);
	itemName.type = 'text';
	itemName.name = 'name';
	itemName.required = true;
	itemName.setAttribute('list','namesDatalist');
	itemName.setAttribute('placeholder', 'Name');
	itemName.focus();

	let listNames = document.createElement('datalist');
	listNames.id='namesDatalist';
	editContainer.appendChild(listNames);

	for (let item of app.items) {
		if( item.list != 'archive' ) continue;

		let option = document.createElement('option');
		option.value = item.name;
		listNames.appendChild(option);
	}

	let itemUnit = document.createElement('select');
	editFields.appendChild(itemUnit);
	itemUnit.name = 'type';
	itemUnit.required = true;
	itemUnit.addEventListener( 'change', app.clearCustomError, false)

	for (let i = 0; i < app.measurments.length; i++) {
		let optionValue = app.measurments[i].name;
		let option = document.createElement('option');
		itemUnit.appendChild(option);
		option.innerHTML = optionValue.capitalizeFirstLetter();
		option.value = i;
	}

	let itemAmount = document.createElement('input');
	editFields.appendChild(itemAmount);
	itemAmount.type = 'number';
	itemAmount.name = 'quantity';
	itemAmount.required = true;
	itemAmount.min = 1;
	itemAmount.setAttribute('placeholder', 'Amount');

	let editSubmit = document.createElement('button');
	editFields.appendChild(editSubmit);
	editSubmit.type = 'submit';
	editSubmit.innerHTML = 'Submit';

	if( item ) {
		if( item.name ) itemName.value = item.name;
		if( item.type ) itemUnit.value = item.type;
		if( item.quantity ) itemAmount.value = item.quantity;
	}
}
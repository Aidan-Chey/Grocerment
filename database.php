<?php
require_once dirname($_SERVER['DOCUMENT_ROOT']).'/scripts.php';

function grocerment_db($username,$password) {
	try {
		return new PDO('mysql:host=putHostAdddressHere;dbname=putDatabaseNameHere',$username,$password);
	} catch (PDOException $e) {
		ob_clean();
		echo json_encode( ['success'=>false,'message'=>'Server unable to connect to database for sync','error'=>$e->getMessage()] );
		exit;
	}
}

function sync_server_client( $clientItems,$database ) {
	$items = array_merge(get_items($database),$clientItems);

	remove_duplicate_items($items);

	$currentDate = new DateTime();
	foreach ($items as $key => $item) {
		$item['last_sync'] = $currentDate->getTimestamp();
		$item['last_change'] = intval($item['last_change']);
		$item['quantity'] = intval($item['quantity']);
		$item['type'] = intval($item['type']);
		$items[$key] = $item;
	}

	update_server($items,$database);

	return $items;
};

function remove_duplicate_items(&$items) {
	foreach ($items as $itemDom) {
		$duplicates = array();

		foreach ($items as $itemPos => $itemSub) {
			if( $itemSub['name'] == $itemDom['name'] ) $duplicates[] = $itemPos;
		}

		if( count($duplicates) > 1 ) {
			$latest_item = NULL;

			foreach ($duplicates as $itemPos) {
				if( is_null($latest_item) || ( intval($items[$itemPos]['last_change']) > intval($latest_item['last_change']) ) ) $latest_item = $items[$itemPos];

				unset($items[$itemPos]);
			}

			$items[] = $latest_item;
		}
	}

	$items = array_values($items);	//Re-index's array elements for conversion to JSON to prevent it being treated as an object
}

function deconstruct_lists($lists) {
	$items = array();

	foreach ($lists as $listName => $list) {
		foreach ($list as $item) {
			$item['list'] = $listName;
			$items[] = $item;
		}
	}

	return $items;
}

function find_matching_item($itemMain,$list){
	foreach ($list as $key => $item) {
		if( $item['name'] === $itemMain['name'] || $item['type'] === $itemMain['type'] ) {
			return $key;
		}
	}
	return false;
}

function compare_items($item1,$item2) {
	if($item2['last_change'] > $item1['last_change']) {
		return $item1;
	} else {
		return $tiem2;
	}
}

function get_items($database) {
	try {
		$s= $database->prepare('
			SELECT
				name
				,quantity
				,obtained
				,last_change
				,(SELECT lists.name FROM lists WHERE lists.uid = items.lists_uid LIMIT 1) AS "list"
				,type
			FROM items
			FOR UPDATE
		');
		$s->execute();
		return $s->fetchAll(PDO::FETCH_ASSOC);
	} catch (PDOException $e) {
		$database->rollback();
		ob_clean();
		echo json_encode( ['success'=>false,'message'=>'Database unable to retrieve list items','error'=>$e->getMessage()] );
		exit;
	}
}

function update_server($items,$database) {
	$bindValue = 0;
	$bindArray = [];
	$insertArray = [];
	$insertQuery = "INSERT INTO items (name,lists_uid,type,quantity,obtained,last_change) VALUES ";

	try {
		$s = $database->query("DELETE FROM items");
	} catch (PDOException $e) {
		$database->rollback();
		ob_clean();
		echo json_encode( ['success'=>false,'message'=>'Error occured while cleaning server items','error'=>$e->getMessage()] );
		exit;
	}

	foreach ($items as $item) {
		$insertArray[] = "( :name".($bindValue+1).",( SELECT uid FROM lists WHERE name = :list".($bindValue+2)." LIMIT 1 ),:type".($bindValue+3).",:quantity".($bindValue+4).",:obtained".($bindValue+5).",:last_change".($bindValue+6)." )";

		$bindArray[':name'.($bindValue+1)] = $item['name'];
		$bindArray[':list'.($bindValue+2)] = $item['list'];
		$bindArray[':type'.($bindValue+3)] = $item['type'];
		$bindArray[':quantity'.($bindValue+4)] = $item['quantity'];
		$bindArray[':obtained'.($bindValue+5)] = ($item['obtained'] ? '1' : '0');
		$bindArray[':last_change'.($bindValue+6)] = $item['last_change'];

		$bindValue = ($bindValue+6);
	}

	try {
		$s = $database->prepare($insertQuery.implode(',', $insertArray));
		$s->execute($bindArray);
	} catch (PDOException $e) {
		$database->rollback();
		ob_clean();
		echo json_encode( ['success'=>false,'message'=>'Error occured while updating server with changes','error'=>$e->getMessage()] );
		exit;
	}
}

function get_lists($database) {
	try {
		$s= $database->prepare("SELECT * FROM lists");
		$s->execute();
		return $s->fetchAll(PDO::FETCH_ASSOC);
	} catch (PDOException $e) {
		$database->rollback();
		ob_clean();
		echo json_encode( ['success'=>false,'message'=>'Database unable to retrieve list types','error'=>$e->getMessage()] );
		exit;
	}
};

function get_measurements($database) {
	try {
		$s= $database->prepare("SELECT * FROM measurements");
		$s->execute();
		return $s->fetchAll(PDO::FETCH_ASSOC);
	} catch (PDOException $e) {
		$database->rollback();
		ob_clean();
		echo json_encode( ['success'=>false,'message'=>'Database unable to retrieve measurements','error'=>$e->getMessage()] );
		exit;
	}
};

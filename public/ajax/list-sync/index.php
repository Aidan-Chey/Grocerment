<?php
//Recives list of choice to sync
//Determines most up to date list items / merging server and locally stored lists
//Sends back updated list to client for local storage / usage from memory

header('Content-Type: application/json');
date_default_timezone_set('Pacific/Auckland');

require_once dirname($_SERVER['DOCUMENT_ROOT']).'/database.php';

$database = grocerment_db($_POST['username'],$_POST['password']);
$database->beginTransaction();

$items = json_decode($_POST['items'],true);

if ( $items === null && json_last_error() !== JSON_ERROR_NONE ) $output = "{'success':false,'error':'Given items not valid JSON'}";
else $output = sync_server_client( $items, $database );

$database->commit();

ob_clean();

echo json_encode ( ['success'=>true,'output'=>$output] );
exit;

<?php
header('Content-Type: application/json');
echo json_encode( ['success'=>false,'error'=>'No ajax method specified']);
exit;
<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$host = 'localhost'; $dbname = 'nitro_black'; $user = 'root'; $pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $user_id = $_POST['user_id'];
    $car_id = $_POST['car_id'];
    $data_retirada = $_POST['data_retirada'];
    $data_devolucao = $_POST['data_devolucao'];
    $loc_id = $_POST['loc_id'];

    // Insere a reserva no banco de dados
    $stmt = $pdo->prepare("INSERT INTO bookings (user_id, car_id, pickup_location_id, dropoff_location_id, data_retirada, data_devolucao) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$user_id, $car_id, $loc_id, $loc_id, $data_retirada, $data_devolucao]);

    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
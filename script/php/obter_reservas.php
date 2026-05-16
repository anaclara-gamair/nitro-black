<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$host = 'localhost'; $dbname = 'nitro_black'; $user = 'root'; $pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        echo json_encode(["status" => "error", "message" => "Usuário não identificado."]);
        exit;
    }

    // Busca apenas reservas ativas para o carrinho
    $stmt = $pdo->prepare("
        SELECT b.id as booking_id, b.data_retirada, b.data_devolucao, c.marca_modelo, c.foto_url, c.valor_aluguel_dia, l.nome_agencia
        FROM bookings b
        JOIN Carros c ON b.car_id = c.id
        JOIN locations l ON b.pickup_location_id = l.id
        WHERE b.user_id = ? AND b.data_devolucao >= CURRENT_DATE()
    ");
    $stmt->execute([$user_id]);
    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "reservas" => $reservas]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
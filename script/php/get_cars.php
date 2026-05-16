<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$host = 'localhost';
$dbname = 'nitro_black';
$user = 'root'; // Mude se o seu usuário do XAMPP for diferente
$pass = ''; // Mude se tiver senha

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Faz um JOIN para pegar os dados do Carro + a Descrição do veículo
   $retirada = $_GET['retirada'] ?? null;
    $devolucao = $_GET['devolucao'] ?? null;

    $sql = "SELECT c.id, c.placa, c.marca_modelo, c.ano, c.valor_aluguel_dia, c.foto_url, c.status, c.location_id,
               d.cor, d.acessorios, d.detalhes_tecnicos, d.estado_de_uso, d.km
            FROM Carros c
            INNER JOIN Descricoes_Veiculo d ON c.id_descricao = d.id
            WHERE c.status = 1";

    // Se passou as datas, esconde os carros que já tem reserva nesse período
    if ($retirada && $devolucao) {
        $sql .= " AND c.id NOT IN (
                    SELECT car_id FROM bookings 
                    WHERE (data_retirada <= :devolucao AND data_devolucao >= :retirada)
                  )";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['retirada' => $retirada, 'devolucao' => $devolucao]);
    } else {
        $stmt = $pdo->query($sql);
    }
    
    $carros = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "carros" => $carros]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao buscar carros: " . $e->getMessage()]);
}
?>
<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$host = 'localhost';
$dbname = 'nitro_black';
$user = 'root'; 
$pass = ''; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Aceita tanto GET quanto POST para a variável 'action'
    $action = $_REQUEST['action'] ?? '';

    // ==========================================
    // BUSCAR TODOS OS USUÁRIOS
    // ==========================================
    if ($action === 'get_users') {
        $stmt = $pdo->query("SELECT id, nome, email, carteira, vencimento_carteira, termo_responsabilidade, eh_admin FROM users");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "users" => $users]);
        exit;
    }

    // ==========================================
    // DELETAR USUÁRIO
    // ==========================================
    if ($action === 'delete_user') {
        $id = $_POST['id'] ?? null;

        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Usuário removido com sucesso!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "ID do usuário não fornecido."]);
        }
        exit;
    }

    // ==========================================
    // DELETAR VEÍCULO
    // ==========================================
    if ($action === 'delete_car') {
        $id = $_POST['id'] ?? null;

        if ($id) {
            // 1º: Pega o ID da descrição para apagar depois
            $stmtInfo = $pdo->prepare("SELECT id_descricao FROM Carros WHERE id = ?");
            $stmtInfo->execute([$id]);
            $carro = $stmtInfo->fetch(PDO::FETCH_ASSOC);

            // 2º: Apaga o Carro
            $stmt = $pdo->prepare("DELETE FROM Carros WHERE id = ?");
            $stmt->execute([$id]);

            // 3º: Apaga a Descrição que estava vinculada a ele
            if ($carro && $carro['id_descricao']) {
                $stmtDesc = $pdo->prepare("DELETE FROM Descricoes_Veiculo WHERE id = ?");
                $stmtDesc->execute([$carro['id_descricao']]);
            }

            echo json_encode(["status" => "success", "message" => "Veículo removido com sucesso!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "ID do veículo não fornecido."]);
        }
        exit;
    }

    echo json_encode(["status" => "error", "message" => "Nenhuma ação válida foi solicitada."]);

} catch (PDOException $e) {
    // Código 23000 do MySQL significa que existe restrição de chave estrangeira
    // Exemplo: tentar apagar um carro que já está registrado em uma reserva no banco
    if ($e->getCode() == '23000') {
        echo json_encode(["status" => "error", "message" => "Bloqueado: Este registro está vinculado a uma reserva ou histórico existente."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Erro: " . $e->getMessage()]);
    }
}
?>
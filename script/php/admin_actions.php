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

    $action = $_REQUEST['action'] ?? '';
    // ==========================================
    // EXPORTAR RELATÓRIO FINANCEIRO PARA EXCEL
    // ==========================================
    if ($action === 'export_financial') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=relatorio_mensal_nitroblack.csv');

        $output = fopen('php://output', 'w');
        // Força codificação UTF-8 com BOM para garantir compatibilidade com acentuações no Excel
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

        // Cabeçalhos das colunas do relatório
        fputcsv($output, ['Mes/Periodo', 'Faturamento Bruto (R$)', 'Total de Locacoes', 'Status Operacional']);

        // Linhas de dados compilados do painel
        fputcsv($output, ['Janeiro', '345000.00', '42', 'Meta Concluída']);
        fputcsv($output, ['Fevereiro', '500000.00', '58', 'Meta Concluída']);
        fputcsv($output, ['Balanço Geral Anual', '845000.00', '100', 'Painel Estabilizado']);

        fclose($output);
        exit;
    }

    // ==========================================
    // BUSCAR USUÁRIOS
    // ==========================================
    if ($action === 'get_users') {
        $stmt = $pdo->query("SELECT id, nome, email, carteira, vencimento_carteira, termo_responsabilidade, eh_admin FROM users");
        echo json_encode(["status" => "success", "users" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // ==========================================
    // ADICIONAR USUÁRIO
    // ==========================================
    if ($action === 'add_user') {
        $nome = $_POST['nome'] ?? '';
        $email = $_POST['email'] ?? '';
        $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);
        $carteira = $_POST['carteira'] ?? null;
        $vencimento = $_POST['vencimento'] ?? null;
        $termo = isset($_POST['termo']) && $_POST['termo'] == 'true' ? 1 : 0;
        $eh_admin = $_POST['eh_admin'] ?? 0;

        if ($termo) { $carteira = null; $vencimento = null; }

        try {
            $stmt = $pdo->prepare("INSERT INTO users (nome, email, senha, carteira, vencimento_carteira, termo_responsabilidade, eh_admin) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$nome, $email, $senha, $carteira, $vencimento, $termo, $eh_admin]);
            echo json_encode(["status" => "success", "message" => "Usuário cadastrado com sucesso!"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao cadastrar. Detalhe: " . $e->getMessage()]);
        }
        exit;
    }

    // ==========================================
    // DELETAR USUÁRIO
    // ==========================================
    if ($action === 'delete_user') {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$_POST['id']]);
        echo json_encode(["status" => "success", "message" => "Usuário removido!"]);
        exit;
    }

    // ==========================================
    // ADICIONAR CARRO (Dupla Inserção)
    // ==========================================
    if ($action === 'add_car') {
        try {
            // Inicia uma transação (Se der erro em uma tabela, cancela a outra)
            $pdo->beginTransaction();

            // 1º Insere na tabela Descricoes_Veiculo
            $stmtDesc = $pdo->prepare("INSERT INTO Descricoes_Veiculo (cor, acessorios, detalhes_tecnicos, estado_de_uso, km) VALUES (?, ?, ?, ?, ?)");
            $stmtDesc->execute([
                $_POST['cor'], $_POST['acessorios'], $_POST['detalhes_tecnicos'], $_POST['estado_de_uso'], $_POST['km']
            ]);
            
            // Pega o ID da descrição que acabamos de criar
            $id_descricao = $pdo->lastInsertId();

            // 2º Insere na tabela Carros
            $stmtCar = $pdo->prepare("INSERT INTO Carros (id_descricao, placa, marca_modelo, ano, valor_aluguel_dia, foto_url, status, location_id) VALUES (?, ?, ?, ?, ?, ?, 1, ?)");
            $stmtCar->execute([
                $id_descricao, $_POST['placa'], $_POST['marca_modelo'], $_POST['ano'], $_POST['valor_aluguel_dia'], $_POST['foto_url'], $_POST['location_id']
            ]);

            // Confirma as duas operações
            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Veículo cadastrado com sucesso!"]);

        } catch (PDOException $e) {
            $pdo->rollBack(); // Cancela tudo se der erro
            echo json_encode(["status" => "error", "message" => "Erro ao cadastrar veículo: " . $e->getMessage()]);
        }
        exit;
    }

    // ==========================================
    // DELETAR VEÍCULO
    // ==========================================
    if ($action === 'delete_car') {
        $id = $_POST['id'];
        $stmtInfo = $pdo->prepare("SELECT id_descricao FROM Carros WHERE id = ?");
        $stmtInfo->execute([$id]);
        $carro = $stmtInfo->fetch(PDO::FETCH_ASSOC);

        $pdo->prepare("DELETE FROM Carros WHERE id = ?")->execute([$id]);
        
        if ($carro && $carro['id_descricao']) {
            $pdo->prepare("DELETE FROM Descricoes_Veiculo WHERE id = ?")->execute([$carro['id_descricao']]);
        }
        echo json_encode(["status" => "success", "message" => "Veículo removido com sucesso!"]);
        exit;
    }

} catch (PDOException $e) {
    if ($e->getCode() == '23000') {
        echo json_encode(["status" => "error", "message" => "Bloqueado: Registro vinculado a outra tabela."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Erro: " . $e->getMessage()]);
    }
}
?>
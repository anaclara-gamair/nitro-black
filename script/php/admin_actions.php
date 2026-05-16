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
    // 1. ESTATÍSTICAS DO DASHBOARD (VALORES REAIS POR MÊS)
    // ==========================================
    if ($action === 'get_dashboard') {
        $stmtAtual = $pdo->query("
            SELECT 
                COUNT(b.id) as qtd, 
                IFNULL(SUM(c.valor_aluguel_dia * GREATEST(DATEDIFF(b.data_devolucao, b.data_retirada), 1)), 0) as fat 
            FROM bookings b 
            JOIN Carros c ON b.car_id = c.id 
            WHERE MONTH(b.data_retirada) = MONTH(CURRENT_DATE()) 
              AND YEAR(b.data_retirada) = YEAR(CURRENT_DATE())
        ");
        $atual = $stmtAtual->fetch(PDO::FETCH_ASSOC);

        $stmtPassado = $pdo->query("
            SELECT COUNT(id) as qtd 
            FROM bookings 
            WHERE MONTH(data_retirada) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) 
              AND YEAR(data_retirada) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)
        ");
        $passado = $stmtPassado->fetch(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "stats" => [
            "atual" => $atual['qtd'],
            "passado" => $passado['qtd'],
            "faturamento" => $atual['fat']
        ]]);
        exit;
    }

    // ==========================================
    // NOVA AÇÃO: BUSCA OS MESES QUE TÊM RESERVAS SALVAS
    // ==========================================
    if ($action === 'get_booking_months') {
        // Pega combinações únicas de Ano e Mês onde há reservas registradas
        $stmt = $pdo->query("SELECT DISTINCT DATE_FORMAT(data_retirada, '%Y-%m') as ano_mes FROM bookings ORDER BY data_retirada DESC");
        echo json_encode(["status" => "success", "meses" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // ==========================================
    // 2. EXPORTAR RELATÓRIO COM NOME DINÂMICO E EMAIL DO CLIENTE
    // ==========================================
    if ($action === 'export_financial') {
        $mes_ano = $_GET['mes'] ?? 'all'; // Recebe no formato "AAAA-MM" (ex: 2026-05) ou "all"
        
        // Define o nome padrão do arquivo
        $nome_arquivo = 'relatorio_geral_nitroblack.csv';
        
        if ($mes_ano !== 'all') {
            $partes = explode('-', $mes_ano);
            $ano = $partes[0];
            $mes_num = $partes[1];
            
            $meses_nomes = [
                '01' => 'janeiro', '02' => 'fevereiro', '03' => 'marco', '04' => 'abril',
                '05' => 'maio', '06' => 'junho', '07' => 'julho', '08' => 'agosto',
                '09' => 'setembro', '10' => 'outubro', '11' => 'novembro', '12' => 'dezembro'
            ];
            $nome_mes = $meses_nomes[$mes_num] ?? 'mes';
            // Altera o nome do arquivo dependendo do mês escolhido!
            $nome_arquivo = "relatorio_{$nome_mes}_{$ano}_nitroblack.csv";
        }

        header('Content-Type: text/csv; charset=utf-8');
        header("Content-Disposition: attachment; filename=$nome_arquivo");
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // Correção de acentuação para o Excel

        if ($mes_ano === 'all') {
            fputcsv($output, ['Periodo', 'Total de Locacoes', 'Faturamento Bruto (R$)']);
            $stmt = $pdo->query("SELECT COUNT(*) as locacoes, IFNULL(SUM(c.valor_aluguel_dia * GREATEST(DATEDIFF(b.data_devolucao, b.data_retirada), 1)), 0) as fat FROM bookings b JOIN Carros c ON b.car_id = c.id");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            fputcsv($output, ['Balanço Geral Histórico', $row['locacoes'], $row['fat']]);
        } else {
            // ADICIONADO O EMAIL DO USUÁRIO NO RELATÓRIO DETALHADO
            fputcsv($output, ['ID Reserva', 'Nome Cliente', 'Email Cliente', 'Veículo (Placa)', 'Data Retirada', 'Data Devolução', 'Valor Total (R$)']);
            
            $stmt = $pdo->prepare("
                SELECT b.id, u.nome, u.email, c.placa, b.data_retirada, b.data_devolucao, 
                       (c.valor_aluguel_dia * GREATEST(DATEDIFF(b.data_devolucao, b.data_retirada), 1)) as valor 
                FROM bookings b 
                JOIN users u ON b.user_id = u.id 
                JOIN Carros c ON b.car_id = c.id 
                WHERE DATE_FORMAT(b.data_retirada, '%Y-%m') = ?
            ");
            $stmt->execute([$mes_ano]);
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                fputcsv($output, [$row['id'], $row['nome'], $row['email'], $row['placa'], $row['data_retirada'], $row['data_devolucao'], $row['valor']]);
            }
        }
        fclose($output);
        exit;
    }

    // ==========================================
    // 3. BUSCAR USUÁRIOS
    // ==========================================
    if ($action === 'get_users') {
        $stmt = $pdo->query("SELECT id, nome, email, carteira, vencimento_carteira, termo_responsabilidade, eh_admin FROM users");
        echo json_encode(["status" => "success", "users" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // ==========================================
    // 4. ADICIONAR USUÁRIO
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
    // 5. DELETAR USUÁRIO
    // ==========================================
    if ($action === 'delete_user') {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$_POST['id']]);
        echo json_encode(["status" => "success", "message" => "Usuário removido!"]);
        exit;
    }

    // ==========================================
    // 6. ADICIONAR CARRO (Dupla Inserção com Transação)
    // ==========================================
    if ($action === 'add_car') {
        try {
            $pdo->beginTransaction();

            // 1º Insere na tabela Descricoes_Veiculo
            $stmtDesc = $pdo->prepare("INSERT INTO Descricoes_Veiculo (cor, acessorios, detalhes_tecnicos, estado_de_uso, km) VALUES (?, ?, ?, ?, ?)");
            $stmtDesc->execute([
                $_POST['cor'], $_POST['acessorios'], $_POST['detalhes_tecnicos'], $_POST['estado_de_uso'], $_POST['km']
            ]);
            
            $id_descricao = $pdo->lastInsertId();

            // 2º Insere na tabela Carros
            $stmtCar = $pdo->prepare("INSERT INTO Carros (id_descricao, placa, marca_modelo, ano, valor_aluguel_dia, foto_url, status, location_id) VALUES (?, ?, ?, ?, ?, ?, 1, ?)");
            $stmtCar->execute([
                $id_descricao, $_POST['placa'], $_POST['marca_modelo'], $_POST['ano'], $_POST['valor_aluguel_dia'], $_POST['foto_url'], $_POST['location_id']
            ]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Veículo cadastrado com sucesso!"]);

        } catch (PDOException $e) {
            $pdo->rollBack(); 
            echo json_encode(["status" => "error", "message" => "Erro ao cadastrar veículo: " . $e->getMessage()]);
        }
        exit;
    }

    // ==========================================
    // 7. DELETAR VEÍCULO
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
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
} catch (PDOException $e) {
    die(json_encode(["status" => "error", "message" => "Erro de conexão: " . $e->getMessage()]));
}

$action = $_POST['action'] ?? '';

// --- CADASTRO ---
if ($action === 'register') {
    $nome = $_POST['nome'] ?? '';
    $email = $_POST['email'] ?? '';
    $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);
    $carteira = $_POST['carteira'] ?? null;
    $vencimento = $_POST['vencimento'] ?? null;
    $termo = isset($_POST['termo']) && $_POST['termo'] == 'true' ? 1 : 0;

    // Se assinou o termo, carteira e vencimento ficam vazios
    if ($termo) {
        $carteira = null;
        $vencimento = null;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO users (nome, email, senha, carteira, vencimento_carteira, termo_responsabilidade) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$nome, $email, $senha, $carteira, $vencimento, $termo]);
        
        echo json_encode(["status" => "success", "message" => "Usuário cadastrado com sucesso!"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao cadastrar. Email já existe?"]);
    }
}

// --- LOGIN ---
if ($action === 'login') {
    $email = $_POST['email'] ?? '';
    $senha = $_POST['senha'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($senha, $user['senha'])) {
        // Remove a senha do retorno por segurança
        unset($user['senha']);
        echo json_encode(["status" => "success", "user" => $user]);
    } else {
        echo json_encode(["status" => "error", "message" => "Email ou senha incorretos!"]);
    }
}
?>
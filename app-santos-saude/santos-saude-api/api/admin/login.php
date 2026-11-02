<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->cpf) && !empty($data->senha)) {
    try {
        $query = "SELECT id, nome, senha_hash FROM administrador WHERE cpf = :cpf";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':cpf', $data->cpf);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($data->senha, $admin['senha_hash'])) {
                echo json_encode(["sucesso" => true, "admin" => ["id" => $admin['id'], "nome" => $admin['nome']]]);
            } else {
                echo json_encode(["sucesso" => false, "erro" => "CPF ou senha incorretos."]);
            }
        } else {
            echo json_encode(["sucesso" => false, "erro" => "CPF ou senha incorretos."]);
        }
    } catch(PDOException $e) {
        echo json_encode(["sucesso" => false, "erro" => "Erro no banco: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["sucesso" => false, "erro" => "Preencha CPF e senha."]);
}
?>
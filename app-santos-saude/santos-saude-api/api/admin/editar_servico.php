<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->nome) && !empty($data->tipo)) {
    try {
        $query = "UPDATE servico SET nome = :nome, tipo = :tipo WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':tipo', $data->tipo);
        $stmt->execute();
        
        echo json_encode(["sucesso" => true]);
    } catch(PDOException $e) {
        echo json_encode(["sucesso" => false, "erro" => "Erro ao editar: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["sucesso" => false, "erro" => "Dados incompletos."]);
}
?>
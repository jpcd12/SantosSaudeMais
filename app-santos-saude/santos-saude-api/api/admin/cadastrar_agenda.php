<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->servico_id) && !empty($data->data_hora)) {
    try {
        $capacidade = !empty($data->capacidade) ? $data->capacidade : 1;
        
        $query = "INSERT INTO slot_agenda (servico_id, data_hora, capacidade, status) 
                  VALUES (:servico_id, :data_hora, :capacidade, 'Disponivel')";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':servico_id', $data->servico_id);
        $stmt->bindParam(':data_hora', $data->data_hora);
        $stmt->bindParam(':capacidade', $capacidade);
        $stmt->execute();
        
        echo json_encode(["sucesso" => true]);
    } catch(PDOException $e) {
        echo json_encode(["sucesso" => false, "erro" => "Erro ao cadastrar: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["sucesso" => false, "erro" => "Dados incompletos."]);
}
?>
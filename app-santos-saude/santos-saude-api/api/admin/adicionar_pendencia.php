<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->paciente_id) && !empty($data->servico_id)) {
    try {
        // Verifica se já existe uma pendência ativa (não cancelada) para este paciente e serviço
        $checkQuery = "SELECT id FROM pendencia WHERE paciente_id = :paciente_id AND servico_id = :servico_id AND status != 'Cancelado'";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':paciente_id', $data->paciente_id);
        $checkStmt->bindParam(':servico_id', $data->servico_id);
        $checkStmt->execute();

        if ($checkStmt->rowCount() > 0) {
            echo json_encode(["sucesso" => false, "duplicada" => true, "erro" => "Este paciente já possui uma pendência para este serviço."]);
            exit;
        }

        // Insere a nova pendência
        $query = "INSERT INTO pendencia (paciente_id, servico_id, status) VALUES (:paciente_id, :servico_id, 'Aguardando')";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':paciente_id', $data->paciente_id);
        $stmt->bindParam(':servico_id', $data->servico_id);
        $stmt->execute();
        
        echo json_encode(["sucesso" => true]);
    } catch(PDOException $e) {
        echo json_encode(["sucesso" => false, "erro" => "Erro: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["sucesso" => false, "erro" => "Dados incompletos."]);
}
?>
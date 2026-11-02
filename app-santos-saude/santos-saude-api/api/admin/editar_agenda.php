<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && isset($data->capacidade) && !empty($data->status)) {
    if ($data->capacidade < 0) {
        responderJson(["sucesso" => false, "erro" => "A capacidade não pode ser negativa."], 400);
    }

    try {
        $conn->beginTransaction();

        $capacidade_final = $data->capacidade;
        $status_final = $data->status;

        $qCount = "SELECT COUNT(*) FROM agendamento WHERE slot_id = :id";
        $stmtCount = $conn->prepare($qCount);
        $stmtCount->bindParam(':id', $data->id);
        $stmtCount->execute();
        $reservas_ativas = $stmtCount->fetchColumn();

        if ($status_final === 'Cancelado') {
            $qRevert = "UPDATE pendencia p
                        JOIN agendamento a ON p.id = a.pendencia_id
                        SET p.status = 'Aguardando'
                        WHERE a.slot_id = :id";
            $stmtRevert = $conn->prepare($qRevert);
            $stmtRevert->bindParam(':id', $data->id);
            $stmtRevert->execute();

            $queryCancel = "DELETE FROM agendamento WHERE slot_id = :id";
            $stmtCancel = $conn->prepare($queryCancel);
            $stmtCancel->bindParam(':id', $data->id);
            $stmtCancel->execute();

            $capacidade_final += $reservas_ativas;
            
        } else if ($capacidade_final == 0) {
            $status_final = 'Esgotado';
        } else if ($status_final === 'Esgotado' && $capacidade_final > 0) {
            $status_final = 'Disponivel';
        }

        $query = "UPDATE slot_agenda SET capacidade = :capacidade, status = :status WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':capacidade', $capacidade_final);
        $stmt->bindParam(':status', $status_final);
        $stmt->execute();

        $qFix = "UPDATE pendencia p
                 LEFT JOIN agendamento a ON p.id = a.pendencia_id
                 SET p.status = 'Aguardando'
                 WHERE p.status = 'Agendado' AND a.id IS NULL";
        $conn->exec($qFix);

        $conn->commit();
        responderJson(["sucesso" => true]);
        
    } catch(PDOException $e) {
        $conn->rollBack();
        responderJson(["sucesso" => false, "erro" => "Erro ao editar: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "Dados incompletos."], 400);
}
?>
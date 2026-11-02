<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->pendencia_id) && !empty($data->slot_id) && !empty($data->cpf)) {
    try {
        $conn->beginTransaction();

        $sSlot = $conn->prepare("SELECT capacidade FROM slot_agenda WHERE id = :slot_id FOR UPDATE");
        $sSlot->bindParam(':slot_id', $data->slot_id);
        $sSlot->execute();
        if ($sSlot->fetchColumn() <= 0) {
            $conn->rollBack();
            responderJson(["sucesso" => false, "erro" => "Este horário esgotou agora mesmo."], 409);
        }

        $sPend = $conn->prepare("SELECT status FROM pendencia WHERE id = :pend_id FOR UPDATE");
        $sPend->bindParam(':pend_id', $data->pendencia_id);
        $sPend->execute();
        if ($sPend->fetchColumn() !== 'Aguardando') {
            $conn->rollBack();
            responderJson(["sucesso" => false, "erro" => "Esta pendência já foi utilizada."], 409);
        }

        $conn->prepare("INSERT INTO agendamento (pendencia_id, slot_id, status) VALUES (?, ?, 'Confirmado')")
             ->execute([$data->pendencia_id, $data->slot_id]);
             
        $agendamento_id = $conn->lastInsertId();

        $conn->prepare("UPDATE pendencia SET status = 'Agendado' WHERE id = ?")
             ->execute([$data->pendencia_id]);

        $conn->prepare("UPDATE slot_agenda SET status = IF(capacidade - 1 <= 0, 'Esgotado', status), capacidade = capacidade - 1 WHERE id = ?")
             ->execute([$data->slot_id]);

        $conn->commit();
        responderJson(["sucesso" => true, "agendamento_id" => $agendamento_id]);

    } catch(PDOException $e) {
        $conn->rollBack();
        responderJson(["sucesso" => false, "erro" => "Erro ao agendar: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "Dados incompletos para o agendamento."], 400);
}
?>
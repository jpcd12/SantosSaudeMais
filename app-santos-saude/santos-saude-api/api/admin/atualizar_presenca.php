<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->agendamento_id) && isset($data->status) && in_array($data->status, ['Concluído', 'Faltou'], true)) {
    try {
        $conn->beginTransaction();

        // Valida que o agendamento ainda está pendente e que o horário já começou.
        $queryPend = "SELECT a.pendencia_id, a.status,
                             (sa.data_hora <= NOW()) AS atendimento_iniciado
                      FROM agendamento a
                      JOIN slot_agenda sa ON sa.id = a.slot_id
                      WHERE a.id = :id
                      FOR UPDATE";
        $stmtPend = $conn->prepare($queryPend);
        $stmtPend->bindParam(':id', $data->agendamento_id);
        $stmtPend->execute();
        $agendamento = $stmtPend->fetch(PDO::FETCH_ASSOC);

        if (!$agendamento || $agendamento['status'] !== 'Confirmado') {
            $conn->rollBack();
            responderJson(["sucesso" => false, "erro" => "Este agendamento já foi atualizado ou não está disponível."], 409);
        }

        if (!(bool)$agendamento['atendimento_iniciado']) {
            $conn->rollBack();
            responderJson(["sucesso" => false, "erro" => "A presença só pode ser registrada após o horário do atendimento."], 403);
        }

        // 1. Atualiza o status do agendamento.
        $query = "UPDATE agendamento SET status = :status WHERE id = :id AND status = 'Confirmado'";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':status', $data->status);
        $stmt->bindParam(':id', $data->agendamento_id);
        $stmt->execute();

        // 2. Mantém a regra existente de encerrar ou devolver a pendência.
        if (!empty($agendamento['pendencia_id'])) {
            if ($data->status === 'Faltou') {
                // Se faltou, a pendência volta para 'Aguardando' permitindo novo agendamento
                $queryUpdPend = "UPDATE pendencia SET status = 'Aguardando' WHERE id = :pendencia_id";
            } else if ($data->status === 'Concluído') {
                // Se compareceu, encerra a pendência como 'Concluído'
                $queryUpdPend = "UPDATE pendencia SET status = 'Concluído' WHERE id = :pendencia_id";
            }

            if (isset($queryUpdPend)) {
                $stmtUpdPend = $conn->prepare($queryUpdPend);
                $stmtUpdPend->bindParam(':pendencia_id', $agendamento['pendencia_id']);
                $stmtUpdPend->execute();
            }
        }

        $conn->commit();
        responderJson(["sucesso" => true, "mensagem" => "Presença/falta registrada com sucesso."]);
    } catch(PDOException $e) {
        $conn->rollBack();
        responderJson(["sucesso" => false, "erro" => "Erro no servidor: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "Dados incompletos."], 400);
}
?>

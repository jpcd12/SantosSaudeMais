<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->agendamento_id)) {
    try {
        // Busca a data do agendamento para validação
        $queryCheck = "SELECT a.pendencia_id, a.slot_id, sa.data_hora, a.status 
                       FROM agendamento a 
                       JOIN slot_agenda sa ON a.slot_id = sa.id 
                       WHERE a.id = :agendamento_id";
        $stmtCheck = $conn->prepare($queryCheck);
        $stmtCheck->bindParam(':agendamento_id', $data->agendamento_id);
        $stmtCheck->execute();
        $agendamento = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$agendamento || $agendamento['status'] !== 'Confirmado') {
            responderJson(["sucesso" => false, "erro" => "Agendamento inválido para cancelamento."], 400);
        }

        // Validação da regra de prazo mínimo (nesse caso, 2 horas)
        $dataHoraAgendamento = new DateTime($agendamento['data_hora']);
        $agora = new DateTime();
        $diferenca = $agora->diff($dataHoraAgendamento);
        $horasFaltantes = ($diferenca->days * 24) + $diferenca->h + ($diferenca->i / 60);

        if ($dataHoraAgendamento < $agora || $horasFaltantes < 2) {
            responderJson(["sucesso" => false, "erro" => "O cancelamento só é permitido com no mínimo 2 horas de antecedência."], 403);
        }

        $conn->beginTransaction();

        // 1. Marca agendamento como cancelado
        $q1 = "UPDATE agendamento SET status = 'Cancelado' WHERE id = :id";
        $s1 = $conn->prepare($q1);
        $s1->bindParam(':id', $data->agendamento_id);
        $s1->execute();

        // 2. Devolve a pendência para a tela "Agendar Pendência"
        $q2 = "UPDATE pendencia SET status = 'Aguardando' WHERE id = :pendencia_id";
        $s2 = $conn->prepare($q2);
        $s2->bindParam(':pendencia_id', $agendamento['pendencia_id']);
        $s2->execute();

        // 3. Libera a vaga no horário
        $q3 = "UPDATE slot_agenda SET capacidade = capacidade + 1, status = 'Disponível' WHERE id = :slot_id";
        $s3 = $conn->prepare($q3);
        $s3->bindParam(':slot_id', $agendamento['slot_id']);
        $s3->execute();

        $conn->commit();
        responderJson(["sucesso" => true]);

    } catch(PDOException $e) {
        $conn->rollBack();
        responderJson(["sucesso" => false, "erro" => "Erro no banco: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "ID não informado."], 400);
}
?>
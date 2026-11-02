<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->agendamento_id) && !empty($data->status)) {
    try {
        $conn->beginTransaction();

        // 1. Atualiza o status do agendamento
        $query = "UPDATE agendamento SET status = :status WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':status', $data->status);
        $stmt->bindParam(':id', $data->agendamento_id);
        $stmt->execute();

        // 2. Localiza a pendência vinculada ao agendamento
        $queryPend = "SELECT pendencia_id FROM agendamento WHERE id = :id";
        $stmtPend = $conn->prepare($queryPend);
        $stmtPend->bindParam(':id', $data->agendamento_id);
        $stmtPend->execute();
        $agendamento = $stmtPend->fetch(PDO::FETCH_ASSOC);

        if ($agendamento && !empty($agendamento['pendencia_id'])) {
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
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

$cpf = isset($_GET['cpf']) ? $_GET['cpf'] : '';

if ($cpf) {
    try {
        $query = "SELECT a.id as agendamento_id, 'Concluído' as agendamento_status, 
                         sa.data_hora, s.nome as servico_nome, s.tipo as servico_tipo 
                  FROM agendamento a 
                  JOIN pendencia p ON a.pendencia_id = p.id 
                  JOIN paciente pac ON p.paciente_id = pac.id 
                  JOIN slot_agenda sa ON a.slot_id = sa.id 
                  JOIN servico s ON p.servico_id = s.id 
                  WHERE pac.cpf = :cpf AND a.status = 'Confirmado' AND sa.data_hora < NOW()
                  ORDER BY sa.data_hora DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':cpf', $cpf);
        $stmt->execute();
        
        responderJson(["sucesso" => true, "historico" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        
    } catch(PDOException $e) {
        responderJson(["sucesso" => false, "erro" => "Erro SQL: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "Nenhum CPF recebido"], 400);
}
?>
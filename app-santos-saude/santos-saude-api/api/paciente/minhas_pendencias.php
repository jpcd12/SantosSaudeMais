<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

$cpf = isset($_GET['cpf']) ? $_GET['cpf'] : null;

if ($cpf) {
    try {
        $query = "SELECT p.id AS pendencia_id, s.nome AS servico_nome, s.id AS servico_id, s.tipo AS servico_tipo,
                         (SELECT COUNT(*) FROM slot_agenda sa 
                          WHERE sa.servico_id = s.id 
                          AND sa.data_hora > NOW() 
                          AND sa.capacidade > 0 
                          AND sa.status = 'Disponivel') AS vagas_disponiveis
                  FROM pendencia p 
                  JOIN servico s ON p.servico_id = s.id 
                  JOIN paciente pac ON p.paciente_id = pac.id
                  WHERE pac.cpf = :cpf AND p.status = 'Aguardando'
                  ORDER BY vagas_disponiveis > 0 DESC, p.id DESC";
                  
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':cpf', $cpf);
        $stmt->execute();
        
        responderJson(["sucesso" => true, "pendencias" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch(PDOException $e) {
        responderJson(["sucesso" => false, "erro" => "Erro: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "CPF não informado."], 400);
}
?>
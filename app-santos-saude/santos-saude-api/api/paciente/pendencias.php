<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once('../../config/database.php');

$cpf = isset($_GET['cpf']) ? $_GET['cpf'] : '';

if ($cpf) {
    try {
        $query = "SELECT p.id as pendencia_id, s.nome as servico_nome, s.tipo as servico_tipo, s.id as servico_id
                  FROM pendencia p 
                  JOIN paciente pac ON p.paciente_id = pac.id 
                  JOIN servico s ON p.servico_id = s.id 
                  WHERE pac.cpf = :cpf AND p.status = 'Aguardando'";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':cpf', $cpf);
        $stmt->execute();
        
        $pendencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        responderJson(["sucesso" => true, "pendencias" => $pendencias]);
        
    } catch(PDOException $e) {
        responderJson(["sucesso" => false, "erro" => "Erro SQL: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "Nenhum CPF recebido"], 400);
}
?>
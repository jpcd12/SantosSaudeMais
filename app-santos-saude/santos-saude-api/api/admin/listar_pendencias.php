<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

try {
    // Faz um JOIN para buscar os nomes do paciente e do serviço atrelados à pendência
    $query = "
        SELECT p.id, p.status, 
               pac.nome AS paciente_nome, pac.cpf AS paciente_cpf, 
               s.nome AS servico_nome, s.tipo AS servico_tipo 
        FROM pendencia p
        JOIN paciente pac ON p.paciente_id = pac.id
        JOIN servico s ON p.servico_id = s.id
        ORDER BY p.id DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $pendencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["sucesso" => true, "pendencias" => $pendencias]);
    
} catch(PDOException $e) {
    echo json_encode(["sucesso" => false, "erro" => "Erro no banco: " . $e->getMessage()]);
}
?>
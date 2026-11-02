<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

try {
    // Busca os serviços e conta os slots futuros com status 'Disponivel' na tabela slot_agenda
    $query = "
        SELECT s.id, s.nome, s.tipo,
        (SELECT COUNT(*) FROM slot_agenda sa 
         WHERE sa.servico_id = s.id 
         AND sa.status = 'Disponivel' 
         AND sa.data_hora > NOW()) AS vagas_ativas
        FROM servico s 
        ORDER BY s.tipo ASC, s.nome ASC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $servicos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["sucesso" => true, "servicos" => $servicos]);
    
} catch(PDOException $e) {
    echo json_encode(["sucesso" => false, "erro" => "Erro no banco: " . $e->getMessage()]);
}
?>
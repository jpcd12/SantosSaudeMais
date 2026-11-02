<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

$servico_id = isset($_GET['servico_id']) ? $_GET['servico_id'] : null;

if ($servico_id) {
    try {
        $query = "SELECT id AS slot_id, data_hora, capacidade 
                  FROM slot_agenda 
                  WHERE servico_id = :servico_id 
                  AND data_hora > NOW() 
                  AND capacidade > 0 
                  AND status = 'Disponivel'
                  ORDER BY data_hora ASC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':servico_id', $servico_id);
        $stmt->execute();
        
        echo json_encode(["sucesso" => true, "horarios" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch(PDOException $e) {
        echo json_encode(["sucesso" => false, "erro" => "Erro: " . $e->getMessage()]);
    }
}
?>
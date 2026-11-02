<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

$servico_id = isset($_GET['servico_id']) ? $_GET['servico_id'] : die(json_encode(["sucesso" => false, "erro" => "ID do serviço não informado."]));

try {
    $query = "SELECT id, data_hora, capacidade, status 
              FROM slot_agenda 
              WHERE servico_id = :servico_id 
              AND data_hora >= NOW() /* CERTIFICA QUE HORÁRIOS ANTIGOS NÃO APAREÇAM */
              ORDER BY data_hora ASC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':servico_id', $servico_id);
    $stmt->execute();
    
    $agenda = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["sucesso" => true, "agenda" => $agenda]);
} catch(PDOException $e) {
    echo json_encode(["sucesso" => false, "erro" => "Erro no banco: " . $e->getMessage()]);
}
?>
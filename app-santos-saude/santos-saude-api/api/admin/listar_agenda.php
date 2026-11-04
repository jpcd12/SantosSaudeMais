<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

$servico_id = isset($_GET['servico_id']) ? $_GET['servico_id'] : die(json_encode(["sucesso" => false, "erro" => "ID do serviço não informado."]));

try {
    $query = "SELECT sa.id, sa.data_hora, sa.capacidade, sa.status 
              FROM slot_agenda sa
              WHERE sa.servico_id = :servico_id
              AND (
                  sa.data_hora >= NOW()
                  OR EXISTS (
                      SELECT 1
                      FROM agendamento a
                      WHERE a.slot_id = sa.id
                        AND a.status = 'Confirmado'
                  )
              )
              ORDER BY sa.data_hora ASC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':servico_id', $servico_id);
    $stmt->execute();
    
    $agenda = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["sucesso" => true, "agenda" => $agenda]);
} catch(PDOException $e) {
    echo json_encode(["sucesso" => false, "erro" => "Erro no banco: " . $e->getMessage()]);
}
?>

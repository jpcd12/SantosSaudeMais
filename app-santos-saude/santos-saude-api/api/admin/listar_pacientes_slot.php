<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

$slot_id = isset($_GET['slot_id']) ? $_GET['slot_id'] : null;

if ($slot_id) {
    try {
        $query = "SELECT a.id AS agendamento_id, a.status AS agendamento_status, 
                         p.nome AS paciente_nome, p.cpf AS paciente_cpf
                  FROM agendamento a
                  JOIN paciente p ON a.paciente_id = p.id
                  WHERE a.slot_id = :slot_id
                  ORDER BY p.nome ASC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':slot_id', $slot_id);
        $stmt->execute();
        
        responderJson(["sucesso" => true, "pacientes" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch(PDOException $e) {
        responderJson(["sucesso" => false, "erro" => "Erro ao listar pacientes: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "Slot ID não informado."], 400);
}
?>
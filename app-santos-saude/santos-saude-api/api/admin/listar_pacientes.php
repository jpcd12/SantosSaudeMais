<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

try {
    $query = "SELECT id, nome, dt_nasc FROM paciente ORDER BY nome ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $pacientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["sucesso" => true, "pacientes" => $pacientes]);
    
} catch(PDOException $e) {
    echo json_encode(["sucesso" => false, "erro" => "Erro no banco: " . $e->getMessage()]);
}
?>
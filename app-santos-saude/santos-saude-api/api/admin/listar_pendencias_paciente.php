<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

$paciente_id = isset($_GET['paciente_id']) ? $_GET['paciente_id'] : null;

if ($paciente_id) {
    try {
        $query = "
            SELECT p.id, p.status, s.nome AS servico_nome, s.tipo AS servico_tipo 
            FROM pendencia p 
            JOIN servico s ON p.servico_id = s.id 
            WHERE p.paciente_id = :paciente_id 
            AND p.id NOT IN (
                SELECT a.pendencia_id 
                FROM agendamento a
                JOIN slot_agenda sa ON a.slot_id = sa.id
                WHERE sa.data_hora < NOW()
            )
            ORDER BY p.id DESC
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':paciente_id', $paciente_id);
        $stmt->execute();
        
        $pendencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["sucesso" => true, "pendencias" => $pendencias]);
    } catch(PDOException $e) {
        echo json_encode(["sucesso" => false, "erro" => "Erro: " . $e->getMessage()]);
    }
}
?>
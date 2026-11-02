<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));
if (!empty($data->id)) {
    try {
        $query = "DELETE FROM pendencia WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->execute();
        echo json_encode(["sucesso" => true]);
    } catch(PDOException $e) {
        echo json_encode(["sucesso" => false, "erro" => "Erro: " . $e->getMessage()]);
    }
}
?>
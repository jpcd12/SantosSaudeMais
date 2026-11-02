<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        $query = "DELETE FROM servico WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->execute();
        
        echo json_encode(["sucesso" => true]);
    } catch(PDOException $e) {
        // O código 23000 indica violação de chave estrangeira (o serviço já tem pendências/agendamentos atrelados a ele)
        if ($e->getCode() == 23000) {
            echo json_encode(["sucesso" => false, "erro" => "Não é possível excluir este serviço pois já existem agendamentos vinculados a ele."]);
        } else {
            echo json_encode(["sucesso" => false, "erro" => "Erro ao excluir: " . $e->getMessage()]);
        }
    }
} else {
    echo json_encode(["sucesso" => false, "erro" => "ID não informado."]);
}
?>
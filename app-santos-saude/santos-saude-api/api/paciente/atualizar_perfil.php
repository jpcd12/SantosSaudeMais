<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->cpf_atual) && !empty($data->cpf_novo) && !empty($data->telefone)) {
    try {
        if ($data->cpf_atual !== $data->cpf_novo) {
            $check = $conn->prepare("SELECT id FROM paciente WHERE cpf = :cpf");
            $check->bindParam(':cpf', $data->cpf_novo);
            $check->execute();
            if ($check->rowCount() > 0) {
                responderJson(["sucesso" => false, "erro" => "Este CPF já está vinculado a outro paciente."], 409);
            }
        }

        $query = "UPDATE paciente SET 
                  cpf = :cpf_novo, 
                  telefone = :telefone, 
                  telefone2 = :telefone2, 
                  telefone3 = :telefone3, 
                  email = :email 
                  WHERE cpf = :cpf_atual";
                  
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':cpf_novo', $data->cpf_novo);
        $stmt->bindParam(':telefone', $data->telefone);
        $stmt->bindParam(':telefone2', $data->telefone2);
        $stmt->bindParam(':telefone3', $data->telefone3);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':cpf_atual', $data->cpf_atual);
        
        $stmt->execute();
        responderJson(["sucesso" => true]);
        
    } catch(PDOException $e) {
        responderJson(["sucesso" => false, "erro" => "Erro no banco: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "CPF e Telefone Principal são obrigatórios."], 400);
}
?>
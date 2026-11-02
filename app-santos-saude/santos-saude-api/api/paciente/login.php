<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->cpf) && !empty($data->senha)) {
    $query = "SELECT id, nome, senha_hash FROM paciente WHERE cpf = :cpf LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':cpf', $data->cpf);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if(password_verify($data->senha, $row['senha_hash'])) {
            responderJson([
            "mensagem" => "Login realizado com sucesso.",
            "paciente_id" => $row['id'],
            "nome" => $row['nome']
        ]);
        } else {
            responderJson(["mensagem" => "Senha incorreta."], 401);
        }
    } else {
        responderJson(["mensagem" => "Paciente não encontrado."], 404);
    }
} else {
    responderJson(["mensagem" => "Informe CPF e senha."], 400);
}
?>
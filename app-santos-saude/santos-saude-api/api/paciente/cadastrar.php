<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->cpf) && !empty($data->nome) && !empty($data->dt_nasc) && !empty($data->email) && !empty($data->senha)) {
    try {
        $query = "INSERT INTO paciente (cpf, nome, dt_nasc, telefone, email, senha_hash) VALUES (:cpf, :nome, :dt_nasc, :telefone, :email, :senha_hash)";
        $stmt = $conn->prepare($query);

        $senha_hash = password_hash($data->senha, PASSWORD_BCRYPT);

        $stmt->bindParam(':cpf', $data->cpf);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':dt_nasc', $data->dt_nasc);
        $stmt->bindParam(':telefone', $data->telefone);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':senha_hash', $senha_hash);

        if($stmt->execute()) {
            responderJson(["mensagem" => "Paciente cadastrado com sucesso."], 201);
        }
    } catch(PDOException $e) {
        responderJson(["mensagem" => "Erro ao cadastrar. O CPF já pode estar em uso."], 400);
    }
} else {
    responderJson(["mensagem" => "Preencha todos os campos obrigatórios, incluindo o e-mail."], 400);
}
?>
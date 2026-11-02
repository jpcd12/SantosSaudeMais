<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
require_once('../../config/database.php');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->cpf)) {
    try {
        $query = "SELECT email FROM paciente WHERE cpf = :cpf";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':cpf', $data->cpf);
        $stmt->execute();
        $paciente = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$paciente) {
            responderJson(["sucesso" => false, "erro" => "CPF não encontrado no sistema."], 404);
        }

        if (empty($paciente['email'])) {
            responderJson([
                "sucesso" => false, 
                "sem_email" => true,
                "erro" => "Este CPF não possui um e-mail cadastrado. Por favor, entre em contato com o WhatsApp da Secretaria de Saúde ou compareça ao posto para redefinir sua senha."
            ], 403);
        }

        $pin = rand(1000, 9999);
        $partesEmail = explode("@", $paciente['email']);
        $emailMascarado = substr($partesEmail[0], 0, 3) . "***@" . $partesEmail[1];

        responderJson([
            "sucesso" => true, 
            "email_mascarado" => $emailMascarado, 
            "pin_simulado" => $pin 
        ]);

    } catch(PDOException $e) {
        responderJson(["sucesso" => false, "erro" => "Erro no servidor: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "CPF não informado."], 400);
}
?>
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once('../../config/database.php');

$cpf = isset($_GET['cpf']) ? $_GET['cpf'] : null;

if ($cpf) {
    try {
        $query = "SELECT nome, cpf, dt_nasc, telefone, telefone2, telefone3, email FROM paciente WHERE cpf = :cpf";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':cpf', $cpf);
        $stmt->execute();
        $perfil = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($perfil) {
            responderJson(["sucesso" => true, "perfil" => $perfil]);
        } else {
            responderJson(["sucesso" => false, "erro" => "Paciente não encontrado."], 404);
        }
    } catch(PDOException $e) {
        responderJson(["sucesso" => false, "erro" => "Erro SQL: " . $e->getMessage()], 500);
    }
} else {
    responderJson(["sucesso" => false, "erro" => "CPF não informado."], 400);
}
?>
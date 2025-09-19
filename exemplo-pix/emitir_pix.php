<?php

$autoload = realpath(__DIR__ . '/vendor/autoload.php');
if (!file_exists($autoload)) {
    die("Autoload file not found or on path <code>$autoload</code>.");
}
require_once $autoload;
 
use Efi\Exception\EfiException;
use Efi\EfiPay;

// Lê o arquivo json com suas credenciais
$file = file_get_contents(__DIR__ . '/credentials.json');
$options = json_decode($file, true);

if (isset($_POST)) {

    $body = [
        "calendario" => [
            "expiracao" => (int) $_POST["expiracao"]
        ],
        "devedor" => [
            "cpf" => $_POST["cpf"],
            "nome" => $_POST["nome_cliente"]
        ],
        "valor" => [
            "original" => $_POST["valor"] // Ex: 0.01
        ],
        "chave" => "sua_chave_pix", // Chave pix da conta Efí do recebedor
        "infoAdicionais" => [
            [
                "nome" => "Produto/Serviço", // Nome do campo string (Nome) ≤ 50 characters
                "valor" => $_POST["descricao"] // Dados do campo string (Valor) ≤ 200 characters
            ]
        ]
    ];

    try {
        $api = EfiPay::getInstance($options);
        $pix = $api->pixCreateImmediateCharge($params = [], $body);

        if ($pix['txid']) {

            $params = [
                'id' => $pix['loc']['id']
            ];

            // Gera QRCode
            $qrcode = $api->pixGenerateQRCode($params);

            $return = [
                "code" => 200,
                "pix" => $pix,
                "qrcode" => $qrcode
            ];

            echo json_encode($return);
        } else {
            echo json_encode($pix);
        }
    } catch (EfiException $e) {
        print_r($e->code);
        print_r($e->error);
        print_r($e->errorDescription);
    } catch (Exception $e) {
        print_r($e->getMessage());
    }
}

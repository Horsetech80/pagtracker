$(document).ready(function () { 
    //Aplicando as mascaras nos inputs cpf, valor e expiracao.

    $("#btn_emitir_pix").click(function () {
        if ($('#form')[0].checkValidity()) {

            $("#myModal").modal('show');
            $("#pix").addClass("hide");

            var descricao = $("#descricao").val();
            var valor = $("#valor").val();
            var nome_cliente = $("#nome_cliente").val();
            var cpf = $("#cpf").val();
            var expiracao = $("#expiracao").val();

            if (parseInt(nome_cliente) == "NaN" || parseInt(valor) == "NaN") {
                $("#myModal").modal('hide');
                alert("Dados inválidos.");

                return false;
            }

            $.ajax({
                url: "emitir_pix.php",
                data: { descricao: descricao, valor: valor, nome_cliente: nome_cliente, cpf: cpf, expiracao: expiracao },
                type: 'post',
                dataType: 'json',
                success: function (resposta) {
                    $("#myModal").modal('hide');
                    if (resposta.code == 200) {
                        $("#myModalResult").modal('show');
                        $("#pix").removeClass("hide");
                        var html = "<th>" + resposta.pix.txid + "</th>"
                        html += "<th><img src='" + resposta.qrcode.imagemQrcode + "'></th>"
                        html += "<th><textarea id='pixcopiacola' rows='7' cols='35' style='padding:2px; font-size: 12px' Disabled>" + resposta.qrcode.qrcode + "</textarea></th>"
                        html += "<th><a target='blank' href='" + resposta.qrcode.linkVisualizacao + "'> " + resposta.qrcode.linkVisualizacao + " </a></th>"
                        
                        $("#result_table").html(html);

                    } else {
                        $("#myModal").modal('hide');
                        alert('Message: ' + resposta.mensagem + '\n' + 'Property: ' + resposta.erros[0].caminho + '\n' + 'Description: ' + resposta.erros[0].mensagem);
                    }
                },
                error: function (resposta) {
                    console.log(resposta)
                    $("#myModal").modal('hide');
                    alert("Ocorreu um erro - Mensagem: " + resposta.responseText)
                }
            });
        } //endif
        else {
            alert("Você deverá preencher todos os dados do formulário.")
        }
    })


})
<!DOCTYPE html>
<html lang="pt-br">

<head>
	<meta charset="UTF-8">
	<!-- <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.css"> -->
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet"
		integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossorigin="anonymous">
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js"
		integrity="sha384-HwwvtgBNo3bZJJLYd8oVXjrBZt8cqVSpeBNS5n7C8IVInixGAoxmnlMuBnhbgrkm"
		crossorigin="anonymous"></script>
	<link rel="stylesheet" href="./assets/bootstrap/css/style.css">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
    <script type="text/javascript" src="./assets/bootstrap/js/script-pix.js"></script>
    <script src="//cdn.jsdelivr.net/npm/sweetalert2@11"></script>

	<title>Exemplos Oficiais das APIs Efí </title>
	<link rel="shortcut icon" href="./assets/img/favicon.png" type="image/x-icon">
</head>

<body>
	<nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid navbar-efi">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
                <span class="sr-only">Toggle navigation</span>
            </button>
            <!-- Logotipo à esquerda -->
            <a class="navbar-brand" href="/exemplos-integracao">
				<img src="./assets/img/logo-efi-pay.svg" alt="Efí" width="90px">
			</a>

            <!-- Botões à direita -->
           
            <div class="navbar-nav ml-auto">
                <a target="blank" class="btn btn-efi-blue" href="https://sejaefi.com.br/central-de-ajuda/efi-bank/como-abrir-conta-na-efi-bank#conteudo">Abra sua conta grátis</a>
				<a target="blank" class="btn btn-efi " href="https://app.sejaefi.com.br/">Acessar minha conta</a>
            </div>
        </div>
    </nav>

	<div class="container-fluid content">
		<div class="mb-5">
			<div class="row">
				<!-- Coluna da Imagem -->
				<div class="col-6 d-flex align-items-start justify-content-start">
					<img src="./assets/img/api_pix.png" alt="Imagem" class="img-api" width="56" height="56">
					<h2 class="mt-3 ms-3">Pix</h2>
				</div>
			</div>
		</div>

    	<div class="row">
            <div class="col-lg-9">
				<form id="form" method="POST" action="emitir_pix.php" class="">
					<div class="row">
						<div class="col-lg-4 mt-5 info-body">
							<h4><strong>Informações do produto</strong></h4>

							<div class="form-group mt-3 mb-4">
								<label for="exampleInputEmail1">Descrição do produto: (<em class="atributo">infoAdicionais</em>)<br><strong class="ex">Ex: Monitor LCD</strong></label>

								<input required type="text" class="form-control mt-1 custom-input" id="descricao" placeholder="Descrição do produto">
							</div>
							<div class="form-group">
								<label for="exampleInputPassword1">Valor do produto: (<em class="atributo">original</em>)<br><strong class="ex">Ex: 50.00</strong></label>
								<input required type="text" class="form-control mt-1 custom-input" id="valor" placeholder="Valor do produto">
							</div>

						</div>
						<div class="col-lg-4 mt-5 info-body">
						<h4><strong>Informações do cliente</strong></h4>

							<div class="form-group mt-3 mb-4">
								<label for="exampleInputEmail1">Nome do cliente: (<em class="atributo">nome</em>) <br><strong class="ex">Ex: Gorbadoc Oldbuck</strong></label>
								<input required type="text" class="form-control mt-1 custom-input" id="nome_cliente" placeholder="Nome do cliente">
							</div>
							<div class="form-group">
								<label for="exampleInputPassword1">CPF: (<em class="atributo">cpf</em>) <br><strong class="ex">Ex: 94271564656 (sem formatação)</strong></label>
								<input required type="text" class="form-control mt-1 custom-input" id="cpf" placeholder="CPF">
							</div>

						</div>
						<div class="col-lg-4 mt-5 info-body">
						<h4><strong>Expiração</strong></h4>

							<div class="form-group mt-3">
								<label for="exampleInputEmail1">Tempo de expiração: (<em class="atributo">expiracao</em>) <br><strong class="ex">3600 (segundos)</strong></label>
								<input required type="text" class="form-control mt-1 custom-input" id="expiracao" placeholder="Tempo de expiração">
							</div>

						</div>
					</div>
				</form>

				<div class="col-lg-12 mt-5">
					<button id="btn_emitir_pix" type="button" class="btn btn-efi-blue icon-success">Emitir Pix <img src="./assets/img/ok-mark.png"></button>
				</div>
            </div>

            <div class="col-lg-3">
                <div style="margin-top: 45px;" class="col-lg-12 content-guidelines">
                    <div class="alert alert-warning" role="alert">
						<img class="me-1 mb-1" src="./assets/img/exclamation-triangle-orange.svg"/> <b>Atenção!</b><br/>
                        <p>Para o funcionamento deste exemplo, você deverá informar o <b>Client_Id</b> e <b>Client_Secret</b> de sua aplicação (<a
						href="./assets/img/credenciais.png" target="_blank"
						title="Veja onde localizar o Client_Id e Client_Secret">?</a>) no arquivo "./credentials.json", alterar o parâmetro <b>sandbox</b>, de acordo com o ambiente utilizado ("sandbox => true" para desenvolvimento e "sandbox => false" para produção), além de informar no atributo <b>certificate</b> o diretório "./certs/", acrescentando o nome do seu certificado.</p>
                        <p>Será necessário também, no arquivo ".emitir_pix.php", inserir sua chave pix registrada na Efí, no parâmetro <b>chave</b>.</p>
                    </div>
                </div>

				<div class="col-lg-12 mt-5">
					<a href="../download/exemplo-pix.zip" class="btn btn-efi"><svg class="icon-download"></svg> Baixar este exemplo </a>
                </div>
            </div>
        </div>
	</div>


	<footer>
		<div class="container-fluid">
			<div class="row">
				<div class="col-md-6">
					<span class="contact-title-efi">Efí Bank</span>
					<br>
					<span class="info_endereco">Av Paulista, 1337, Edifício Paulista 1 - Bela Vista, São Paulo, SP -
						01311-200, Brasil</span>
				</div>
				<div class="col-md-6" id="msg-box">
					<div class="row">
						<div class="col-md-3" id="contact-box">
							<span class="contact-title">(11) 2394 2208</span>
						</div>
						<div class="col-md-3" id="contact-box">
							<span class="contact-title">0800 941 2343</span>
						</div>
						<div class="col-md-3" id="contact-box">
							<span class="contact-title">4000 1234</span>
						</div>
						<div class="col-md-3" id="contact-box">
							<span class="contact-title">0800 940 0361</span>
						</div>
					</div>
					<div class="row">
						<div class="col-md-3" id="contact-box">
							<p>São Paulo e região</p>
						</div>
						<div class="col-md-3" id="contact-box">
							<p>Ligações de telefone fixo</p>
						</div>
						<div class="col-md-3" id="contact-box">
							<p>Regiões metropolitanas</p>
						</div>
						<div class="col-md-3" id="contact-box">
							<p>Ouvidoria</p>
						</div>
					</div>
				</div>
			</div>
			<div class="row footer-redes">
				<div class="container">
					<div class="row">
						<div class="col-md-6">
							<div class="row">
								<div class="col-md-1">
									<a href="https://sejaefi.com.br/efi-bank" target="_blank"><svg
											xmlns="http://www.w3.org/2000/svg" width="65.161" height="51.056"
											viewBox="0 0 65.161 51.056">
											<g id="Group_27158" data-name="Group 27158"
												transform="translate(-96 -5165.238)">
												<path id="Path_21451" data-name="Path 21451"
													d="M56.808,11.283l8.353-3.077V0L55.05,7.913a2.1,2.1,0,0,0-1.026,1.709,1.906,1.906,0,0,0,2.784,1.661M54.024,39.761H59.4V13.872H54.024Zm-24.374,0h5.373V29.8H48.455V24.911H35.023c-.1-4.054,2.638-6.5,6.4-6.5a8.916,8.916,0,0,1,5.129,1.661l3.419-3.859a13.52,13.52,0,0,0-8.4-2.833c-7.083,0-11.918,4.689-11.918,11.528ZM5.471,24.081c.782-3.517,3.566-5.666,7.424-5.666,3.908,0,6.5,2.149,6.985,5.666Zm19.929,2.2c0-5.959-4.3-12.9-12.5-12.9C5.666,13.384,0,18.806,0,26.621S5.715,40.249,13.433,40.249a13.774,13.774,0,0,0,11.186-5.666l-3.761-3.077a9.066,9.066,0,0,1-7.571,3.712,7.448,7.448,0,0,1-7.815-6.252H22.748A2.356,2.356,0,0,0,25.4,26.279"
													transform="translate(96 5165.238)" fill="#586475" />
												<path id="Path_21452" data-name="Path 21452"
													d="M105.38,141.781h-.3l2.538,6.168h1.244l-2.716-6.345a.915.915,0,0,0-.888-.635.952.952,0,0,0-.914.635l-2.715,6.345h1.218Zm-10.533,6.168h1.142v-6.98H94.847Zm3.426-3.274a2.023,2.023,0,0,0,2.157-1.954c0-1.066-.838-1.752-2.107-1.752h-2.97v1.016h2.817a.944.944,0,0,1,1.066.939.961.961,0,0,1-.965,1.015Zm11.879,3.274h1.142l-.051-6.295-.609.229,4.036,5.584a1.01,1.01,0,0,0,.812.482.7.7,0,0,0,.66-.761v-6.219H115l.051,6.3.609-.229-4.036-5.584a.932.932,0,0,0-.787-.482.718.718,0,0,0-.685.762Zm-7.234-1.4h4.67v-1.015h-4.67Zm20.229,1.4h1.447l-3.223-3.5,3.2-3.477H123.1l-2.64,2.919a.763.763,0,0,0,0,1.142Zm-4.671,0h1.142v-6.98h-1.142Zm-23.122,0H98.3c1.548,0,2.411-.761,2.411-1.929a2.227,2.227,0,0,0-2.437-2.081H95.354v1.015h3.071c.634,0,1.066.33,1.066.914,0,.659-.533,1.066-1.294,1.066H95.354Z"
													transform="translate(30.809 5068.345)" fill="#586475" />
											</g>
										</svg></a>
								</div>
								<div class="col mt-3 info">
									© 2007-2023 • Efí - Instituição de Pagamento. Todos os direitos reservados.
									<br>Efí S.A. CNPJ: 09.089.356/0001-18
								</div>
							</div>
						</div>
						<div class="col-md-6 justify-content-end d-flex">
							<ul class="list-unstyled d-flex">
								<li class="ms-6"><a href="https://www.youtube.com/@sejaefi" target="_blank"><img
											src="./assets/img/rede1.svg" /></a></li>
								<li class="ms-6"><a href="https://www.instagram.com/sejaefi/" target="_blank"><img
											src="./assets/img/rede2.svg" /></a></li>
								<li class="ms-6"><a href="https://www.linkedin.com/company/sejaefi/"
										target="_blank"><img src="./assets/img/rede-3.svg" /></a></li>
								<li class="ms-6"><a href="https://www.facebook.com/sejaefi" target="_blank"><img
											src="./assets/img/rede-4.svg" /></a></li>
								<li class="ms-6"><a href="https://twitter.com/sejaefi" target="_blank"><img
											src="./assets/img/rede-5.svg" /></a></li>
								<li class="ms-6"><a href="https://www.tiktok.com/@sejaefi" target="_blank"><img
											src="./assets/img/rede-6.svg" /></a></li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	</footer>
	 <!-- Este componente é utilizando para exibir um alerta(modal) para o usuário aguardar as consultas via API.  -->
	 <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
					<h4 class="modal-title" id="myModalLabel">Um momento</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    Estamos processando a requisição <img src="./assets/img/ajax-loader.gif">
                </div>
                
            </div>
        </div>
    </div>

    <!-- Este componente é utilizando para exibir um alerta(modal) para o usuário aguardar as consultas via API.  -->
    <div class="modal fade" id="myModalResult" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
					<h4 class="modal-title" id="myModalLabel">Retorno da emissão de Pix</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    <!--div responsável por exibir o resultado da emissão do pix-->
                    <div id="pix" class="hide">
                        <div class="panel panel-success">
                            <div class="panel-body">
                                <div class="table-responsive">
                                    <table class="table">

                                        <caption></caption>
                                        <thead>
                                            <tr>
                                                <th>txid da cobrança (<em>txid</em>)</th>
                                                <th>Imagem QR Code</th>
                                                <th>Pix Copia e Cola</th>
                                                <th>Link de Visualização</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr id="result_table">
                                            </tr>
                                        </tbody>
                                    </table>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

<script>
    window.addEventListener("load", function(event) {
        Swal.fire({
            title: 'Exemplo de integração Efí',
            icon: 'info',
            html: 'Esta página é somente para demonstração, mas você pode testar a vontade e baixar o código de exemplo.',
            showCloseButton: true,
            focusConfirm: true,
            confirmButtonText: '<img src="./assets/img/ok-mark.png">',
            confirmButtonColor: '#0BA1C2'
        });
    });
</script>

</html>
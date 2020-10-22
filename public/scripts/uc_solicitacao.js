"use strict";

import ViewSolicitacao from "./view_solicitacao.js";
import DaoPaciente from "./dao_paciente.js";

const download = new Function("blob", "download(blob)");

export default class CtrlSolicitacao {
  constructor() {
    this.view = new ViewSolicitacao(this);

    this.daoPaciente = new DaoPaciente();

    this.usrApp = null;

    this.arrayPacientes = [];
    this.dtPeriodo = null;
    this.arrayLocais = [];
    this.arrayExames = [];

    this.init();
  }

  //-----------------------------------------------------------------------------------------//

  async init() {
    this.view.colocarEspera();

    await this.daoPaciente.abrirDB();
    await this.obterPacientes();
    await this.obterPeriodo();
    await this.obterLocais();

    this.view.atualizarInterface(
      this.usrApp.ehMedico,
      this.arrayPacientes,
      this.arrayLocais
    );

    this.view.tirarEspera();
  }

  //-----------------------------------------------------------------------------------------//

  async obterPacientes() {
    this.arrayPacientes = await this.daoPaciente.obterPacientes();
    this.usrApp = window.retornarUsrApp();
    if (this.usrApp.ehMedico) {
      if (this.arrayPacientes.length > 0) {
        this.posAtual = 0;
      } else {
        this.posAtual = -1;
        this.cpfAtual = null;
      }
    } else {
      this.arrayPacientes = [
        {
          cpf: this.usrApp.login,
          nome: this.usrApp.nome,
          celular: this.usrApp.celular,
          email: this.usrApp.email
        }
      ];
    }
  }

  //-----------------------------------------------------------------------------------------//

  async obterLocais() {
    let response = await fetch("/obterLocais/");
    this.arrayLocais = await response.json();
    if (!this.arrayLocais) {
      console.log("obterLocais sem conteúdo");
      alert("Erro na conexão com o Servidor #02APP");
      this.arrayLocais = [];
      return;
    }
    if (this.arrayLocais.hasOwnProperty("erro")) {
      alert(this.arrayLocais.erro);
      this.arrayLocais = [];
      if (this.arrayLocais.erro == "Sessão Expirada")
        window.location.href = "index.html";
      return;
    }
    await this.arrayLocais.sort(function(a, b) {
      var keyA = a.codigolocal;
      var keyB = b.codigolocal;
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
  }

  //-----------------------------------------------------------------------------------------//

  async obterPeriodo() {
    let response = await fetch("/obterPeriodo/");
    console.log("obterPeriodo retorno", response);
    if (!response) {
      console.log("(app.js) renderObterPeriodo sem conteúdo");
      return;
    }
    let objPeriodo = await response.json();
    if (objPeriodo.hasOwnProperty("erro")) {
      alert(objPeriodo.erro);
      this.dtPeriodo = null;
      return;
    } else {
      console.log("obterPeriodo -> ", objPeriodo.Periodo);
      var dia = objPeriodo.Periodo.substring(0, 2);
      var mes = objPeriodo.Periodo.substring(3, 5);
      var ano = objPeriodo.Periodo.substring(6, 10);
      this.dtPeriodo = ano + "-" + mes + "-" + dia;
    }
  }

  //-----------------------------------------------------------------------------------------//

  async obterExames(local, exame) {
    if (exame == null || exame == "") exame = "*";
    let response = await fetch("/obterExames/" + local + "/" + exame);
    if (!response) {
      console.log("(app.js) obterExames sem conteúdo");
      return;
    }
    let objExames = await response.json();
    if (objExames.hasOwnProperty("erro")) {
      alert(objExames.erro);
      this.arrayExames = [];
      return;
    } else {
      this.arrayExames = JSON.parse(objExames);
      this.view.atualizarExames(this.arrayExames);
    }
  }

  //-----------------------------------------------------------------------------------------//

  async verificarSenha(senha) {
    let response = await fetch("/verificarSenha/" + senha);
    if (!response) {
      return false;
    }
    if (response.hasOwnProperty("erro")) {
      alert(response.erro);
      return false;
    }
    return true;
  }

  //-----------------------------------------------------------------------------------------//

  async enviarPagamentoAgendamento(
    codExecutante,
    cpfPaciente,
    nomePaciente,
    emailPaciente,
    codExame,
    dataExame,
    numCartao,
    nomeCartao,
    bandeira,
    mesValidade,
    anoValidade,
    cvv,
    nomeExame,
    nomeExecutante,
    endereco,
    valor
  ) {
    this.view.colocarEspera();
    let merchantOrderId = "";
    let proofOfSale = "";
    let paymentId = "";

    // Processando o pagamento
    let requisicao =
      "/pgtocc" +
      "/" +
      cpfPaciente.replace(/\.|-/g, "") +
      "/" +
      nomePaciente +
      "/" +
      emailPaciente +
      "/" +
      numCartao.replace(/ /g, "") +
      "/" +
      nomeCartao +
      "/" +
      bandeira +
      "/" +
      mesValidade +
      "/" +
      anoValidade +
      "/" +
      cvv +
      "/" +
      valor.replace(/\.|\,/g, "");
    let response = await fetch(requisicao);
    let resposta = await response.json();
    if (!resposta) {
      console.log("Erro no pagamento");
      this.view.tirarEspera();
      alert("Erro - pagamento não processado");
      return;
    }
    if (resposta.Payment.ReasonCode == 0) {
      merchantOrderId = resposta.MerchantOrderId;
      proofOfSale = resposta.Payment.ProofOfSale;
      paymentId = resposta.Payment.PaymentId;
    } else {
      this.view.tirarEspera();
      switch (resposta.Payment.ReasonCode) {
        case 7:
          alert("Pagamento Recusado: Não Autorizado");
          return;
        case 12:
          alert("Pagamento Recusado: Problemas com o Cartão de Crédito");
          return;
        case 13:
          alert("Pagamento Recusado: Cartão Cancelado");
          return;
        case 14:
          alert("Pagamento Recusado: Cartão de Crédito Bloqueado");
          return;
        case 15:
          alert("Pagamento Recusado: Cartão Expirado");
          return;
        case 4:
        case 22:
          alert("Pagamento não realizado: Tempo Expirado");
          return;
        default:
          alert("Pagamento Recusado");
          return;
      }
    }
    //
    // Status: representa o status atual da transação.
    // ReasonCode: representa o status da requisição.
    // ProviderReturnCode: representa o código de resposta da transação da adquirente.
    // Por exemplo, uma requisição de autorização poderá ter o retorno com ReasonCode=0 (Sucessfull),
    // ou seja, a requisição finalizou com sucesso, porém, o Status poderá ser 0-Denied, por ter a
    // transação não autorizada pela adquirente, por exemplo, ProviderReturnCode 57 (um dos códigos de negada da Cielo)
    //
    //

    // Agendamento
    requisicao =
      "/agendamento" +
      "/" +
      codExecutante +
      "/" +
      this.usrApp.login +
      "/" +
      nomePaciente +
      "/" +
      cpfPaciente.replace(/\.|-/g, "") +
      "/" +
      codExame +
      "/" +
      dataExame +
      "/" +
      this.dtPeriodo +
      "/" +
      "S";
    //faturar;
    console.log("(app.js) Executando agendamento");
    response = await fetch(requisicao);
    resposta = await response.json();

    if (!resposta) {
      console.log(" erro no agendamento");
      this.view.tirarEspera();
      alert("Erro no agendamento do exame.");
      return;
    }
    console.log("(app.js) renderAgendamento -> ", response);
    if (resposta.mensagem == "Ok") {
      this.view.tirarEspera();
      alert("Exame agendado com sucesso!\nAguarde download de confirmação.");
      this.view.colocarEspera();
      requisicao =
        "/gerarConfirmacao" +
        "/" +
        cpfPaciente +
        "/" +
        nomePaciente +
        "/" +
        numCartao +
        "/" +
        nomeCartao +
        "/" +
        bandeira +
        "/" +
        nomeExame +
        "/" +
        nomeExecutante +
        "/" +
        endereco +
        "/" +
        valor +
        "/" +
        merchantOrderId +
        "/" +
        proofOfSale +
        "/" +
        paymentId;

      let response = await fetch(requisicao);
      let blob = await response.blob();
      await download(blob);
      this.view.tirarEspera();
      alert("Download de documento de confirmação realizado.");
      window.history.go(-1);
    } else {
      alert("Erro no agendamento\n" + JSON.stringify(resposta));
    }
  }

  //-----------------------------------------------------------------------------------------//

  chamarCadastrarPacientes() {
    window.location.href = "bdpaciente.html";
  }

  //-----------------------------------------------------------------------------------------//

  callbackSair() {
    history.go(-1);
  }

  //-----------------------------------------------------------------------------------------//
}

var ucSolicitacao = new CtrlSolicitacao();

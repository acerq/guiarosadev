"use strict";

import ViewSolicitacao from "./view_solicitacao.js";
import DaoPaciente from "./dao_paciente.js";

const download = new Function("blob,nomeArq", "download(blob,nomeArq,'application/pdf')");

export default class CtrlSolicitacao {
  constructor() {
    this.view = new ViewSolicitacao(this);

    this.view.colocarEspera();

    this.daoPaciente = new DaoPaciente();

    this.usrApp = null;
    this.arrayPacientes = [];
    this.arrayLocais = [];
    this.arrayExames = [];

    this.init();
  }

  //-----------------------------------------------------------------------------------------//

  async init() {

    await this.obterLocais();
    
    this.usrApp = await window.retornarUsrApp();
    if(this.view.usuarioLogado) {
      await this.daoPaciente.abrirDB();
      await this.obterPacientes();
    } 
    this.view.atualizarInterface(
      this.usrApp.ehMedico,
      this.arrayPacientes,
      this.arrayLocais
    );
    if(this.view.usuarioLogado && this.usrApp.agendamento != null) {
        this.view.tirarEspera();
        await this.completarPgtoDebito();
    }
    this.view.tirarEspera();
  }

  //-----------------------------------------------------------------------------------------//

  async obterPacientes() {
    if (this.usrApp.ehMedico) {
      this.arrayPacientes = await this.daoPaciente.obterPacientes();
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
    let response = await fetch("/obterLocais/", { credentials : "include" });
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

  async obterExames(local, exame) {
    if (exame == null || exame == "") exame = "*";
    let response = await fetch("/obterExames/" + local + "/" + exame, { credentials : "include" });
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
    let response = await fetch("/verificarSenha/" + senha, { credentials : "include" });
    if (!response) {
      return false;
    }
    let msg = await response.json();
    if (msg.hasOwnProperty("erro")) {
      return false;
    }
    return true;
  }

  //-----------------------------------------------------------------------------------------//

  async enviarAgendamentoPgtoCC(
    codExecutante,
    cpfPaciente,
    nomePaciente,
    emailPaciente,
    codExame,
    numCartao,
    nomeCartao,
    bandeira,
    mesValidade,
    anoValidade,
    cvv,
    nomeExame,
    nomeExecutante,
    endereco,
    valor,
    forma
  ) {
    this.view.colocarEspera();
    let agora = new Date();
    let timeMillis = agora.getTime().toString();
    //let merchantOrderId =   this.usrApp.login + "-" + timeMillis;
    let merchantOrderId = timeMillis;

    let proofOfSale = "";
    let paymentId = "";

    // Processando o pagamento
    let requisicao =
      "/pgtocc" +
      "/" +
      cpfPaciente+
      "/" +
      nomePaciente +
      "/" +
      emailPaciente +
      "/" +
      merchantOrderId +
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
      
    let response = await fetch(requisicao, { credentials : "include" });
    let resposta = await response.json();
    if (!resposta || !resposta.Payment) {
      console.log("Erro no pagamento");
      this.view.tirarEspera();
      let mensagem = "Erro - pagamento não processado";
      if(resposta.Code)
        mensagem += ": #" + resposta.Code;
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
    requisicao =   //TODO ACRESCENTAR O merchantOrderId
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
      nomeExame +
      "/" +
      nomeExecutante +
      "/" +
      endereco +
      "/" +
      "S";
      //TODO faturar;
    console.log("(app.js) Executando agendamento");
    response = await fetch(requisicao, { credentials : "include" });
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
      cpfPaciente = cpfPaciente.substring(0, 3) + "." + cpfPaciente.substring(3, 6) + "." + cpfPaciente.substring(6, 9) + "-" + cpfPaciente.substring(cpfPaciente.length-2);
      valor = valor.substring(0, valor.length - 2) + "," + valor.substring(valor.length - 2);
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
        "Cartão de Crédito" +
        "/" +
        merchantOrderId +
        "/" +
        proofOfSale +
        "/" +
        paymentId +
        "/" +
        "null";

      let response = await fetch(requisicao, { credentials : "include" });
      let blob = await response.blob();
      
      let nomeArq = merchantOrderId + ".pdf";
      await download(blob, nomeArq);
      this.view.tirarEspera();
      alert("Documento de confirmação '" + nomeArq + "'\nsalvo na pasta de downloads");
      
      var file = window.URL.createObjectURL(blob);
      
      this.view.exibirConfirmacao(cpfPaciente, nomePaciente, nomeExame, nomeExecutante, endereco, 
                                  valor, "Cartão de Crédito", merchantOrderId, null);      
    } else {
      alert("Erro no agendamento\n" + JSON.stringify(resposta));
    }
  }

  //-----------------------------------------------------------------------------------------//

  async enviarAgendamentoPgtoDebito( 
    codExecutante,
    cpfPaciente,
    nomePaciente,
    emailPaciente,
    codExame,
    numCartao,
    nomeCartao,
    bandeira,
    mesValidade,
    anoValidade,
    nomeExame,
    nomeExecutante,
    endereco,
    valor,
    forma
  ) {
    this.view.colocarEspera();
    let proofOfSale = "";
    let paymentId = "";
    let authenticationUrl = "";

    let agora = new Date();
    let timeMillis = agora.getTime().toString();
    //let merchantOrderId =   this.usrApp.login + "-" + timeMillis;
    let merchantOrderId = timeMillis;

    // Processando o pagamento
    let requisicao =
      "/pgtodebito" +
      "/" +
      cpfPaciente +
      "/" +
      nomePaciente +
      "/" +
      emailPaciente +
      "/" +
      merchantOrderId +
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
      valor.replace(/\.|\,/g, "");
      
    let response = await fetch(requisicao, { credentials : "include" });
    let resposta = await response.json();
    if (!resposta) {
      console.log("Erro no pagamento");
      this.view.tirarEspera();
      alert("Erro - pagamento não processado");
      return;
    }
    this.view.tirarEspera();
    switch (resposta.Payment.ReasonCode) {
      case 0:
      case 9:
        merchantOrderId = resposta.MerchantOrderId;
        proofOfSale = resposta.Payment.ProofOfSale;
        paymentId = resposta.Payment.PaymentId;
        authenticationUrl = resposta.Payment.AuthenticationUrl;
        break;
      case 7:
        alert("Pagamento Recusado: Não Autorizado");
        return;
      case 12:
        alert("Pagamento Recusado: Problemas com o Cartão de Débito");
        return;
      case 13:
        alert("Pagamento Recusado: Cartão Cancelado");
        return;
      case 14:
        alert("Pagamento Recusado: Cartão de Débito Bloqueado");
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
      nomeExame +
      "/" +
      nomeExecutante +
      "/" +
      endereco +
      "/" +
      "S";
    //faturar;
    console.log("(app.js) Executando agendamento");
    response = await fetch(requisicao, { credentials : "include" });
    resposta = await response.json();

    if (!resposta) {
      console.log(" erro no agendamento");
      this.view.tirarEspera();
      alert("Erro no agendamento do exame.");
      return;
    }
    console.log("(app.js) renderAgendamento -> ", response);

    alert("Você será redirecionado ao seu banco para completar o pagamento por Cartão de Débito");
    window.location.href = authenticationUrl;
  }

  //-----------------------------------------------------------------------------------------//

  async completarPgtoDebito() {
      
  let response = await fetch("/verificarPgto", { credentials : "include" });
  let ses = await response.json();
    if (!ses) {
      console.log("Erro no pagamento");
      this.view.tirarEspera();
      alert("Erro - pagamento não processado");
      return;
  }
  
  switch (ses.pgto.status) {
    case 0:
      alert("Pagamento não finalizado");
      break;
    case 1:
      alert("Pagamento por boleto autorizado");
      break;
    case 2:
      alert("Pagamento confirmado e finalizado");
      break;
    case 3:
      alert("Pagamento negado por autorizador");
      return;
    case 10:
      alert("Pagamento Cancelado");
      return;
    case 11:
      alert("Pagamento Cancelado/Estornado");
      return;
    case 12:
      alert("Esperando retorno da instituição financeira");
      return;
    case 13:
      alert("Pagamento cancelado por falha no processamento");
      return;
    case 20:
      alert("Pagamento por crédito com recorrência agendada");
      return;
    default:
      alert("indefinido");
      return;
    } 
          
    let cpfPaciente = ses.agendamento.cpf.substring(0, 3) + "." + ses.agendamento.cpf.substring(3, 6) + "." + 
                      ses.agendamento.cpf.substring(6, 9) + "-" + ses.agendamento.cpf.substring(ses.agendamento.cpf.length-2);
    let valor = ses.pgto.valor.substring(0, ses.pgto.valor.length - 2) + "," + ses.pgto.valor.substring(ses.pgto.valor.length - 2);
    alert("Exame agendado com sucesso!\nAguarde download de confirmação.");

    let requisicao =
        "/gerarConfirmacao" +
        "/" +
        cpfPaciente +
        "/" +
        ses.agendamento.nome +
        "/" +
        ses.pgto.numeroCartao +
        "/" +
        ses.pgto.nomeCartao +
        "/" +
        ses.pgto.bandeira +
        "/" +
        ses.agendamento.nomeExame + //TODO
        "/" +
        ses.agendamento.nomeExecutante +
        "/" +
        ses.agendamento.enderecoExecutante +
        "/" +
        valor +
        "/" +
        "Cartão de Débito" +
        "/" +
        ses.pgto.merchantOrderId +
        "/" +
        ses.pgto.proofOfSale +
        "/" +
        ses.pgto.paymentId +
        "/" +
        "null"; // URL 

      response = await fetch(requisicao, { credentials : "include" });
      let blob = await response.blob();
      let nomeArq = ses.pgto.merchantOrderId + ".pdf";
      await download(blob, nomeArq);
      this.view.tirarEspera();
      alert("Documento de confirmação " + nomeArq + " salvo na pasta de downloads");
      // alert("Redirecionando para autenticação");
            
      this.view.exibirConfirmacao(cpfPaciente, ses.agendamento.nome, "nomeExame", "nomeExecutante", "endereco", 
                                  valor, "Cartão de Débito", ses.pgto.merchantOrderId, null);      

      // window.history.go(-1);
  }

  //-----------------------------------------------------------------------------------------//

async enviarAgendamentoPgtoBoleto(
    codExecutante,
    cpfPaciente,
    nomePaciente,
    emailPaciente,
    codExame,
    nomeExame,
    nomeExecutante,
    endereco,
    valor,
    forma
  ) {
    this.view.colocarEspera();
    let proofOfSale = "";
    let paymentId = "";
    let url = ""; 
      
    let agora = new Date();
    let timeMillis = agora.getTime().toString();
    // let merchantOrderId =   this.usrApp.login + "-" + timeMillis;
    let merchantOrderId = timeMillis;

    // Processando o pagamento
    let requisicao =
      "/pgtoboleto" +
      "/" +
      cpfPaciente +
      "/" +
      nomePaciente +
      "/" +
      emailPaciente +
      "/" +
      merchantOrderId +
      "/" +
      valor.replace(/\.|\,/g, "") +
      "/" +
      nomeExame;
      
    let response = await fetch(requisicao, { credentials : "include" });
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
      url = resposta.Payment.Url;
    } else {
      this.view.tirarEspera();
      switch (resposta.Payment.ReasonCode) {
        case 7:
          alert("Pagamento Recusado: Não Autorizado");
          return;
        case 9:
          alert("Aguardando o processamento do cartão de débito.");
          merchantOrderId = resposta.MerchantOrderId;
          proofOfSale = resposta.Payment.ProofOfSale;
          paymentId = resposta.Payment.PaymentId;
          return;
        case 12:
          alert("Pagamento Recusado: Problemas com o Cartão de Débito");
          return;
        case 13:
          alert("Pagamento Recusado: Cartão Cancelado");
          return;
        case 14:
          alert("Pagamento Recusado: Cartão de Débito Bloqueado");
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
      nomeExame +
      "/" +
      nomeExecutante +
      "/" +
      endereco +
      "/" +
      "S";
    //faturar;
    console.log("(app.js) Executando agendamento");
    response = await fetch(requisicao, { credentials : "include" });
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
      //TODO cpfPaciente = cpfPaciente.substring(0, 3) + "." + cpfPaciente.substring(3, 6) + "." + cpfPaciente.substring(6, 9) + "-" + cpfPaciente.substring(cpfPaciente.length-2);
      valor = valor.substring(0, valor.length - 2) + "," + valor.substring(valor.length - 2);

      requisicao =
        "/gerarConfirmacao" +
        "/" +
        cpfPaciente +
        "/" +
        nomePaciente +
        "/" +
        "BOLETO" +
        "/" +
        "BOLETO" +
        "/" +
        "BOLETO" +
        "/" +
        nomeExame +
        "/" +
        nomeExecutante +
        "/" +
        endereco +
        "/" +
        valor +
        "/" +
        "Boleto" +
        "/" +
        merchantOrderId +
        "/" +
        proofOfSale +
        "/" +
        paymentId +
        "/" +
        url.replace(/\//g, "%2F");

      let response = await fetch(requisicao, { credentials : "include" });
      let blob = await response.blob();
      let nomeArq = merchantOrderId + ".pdf";
      await download(blob, nomeArq);
      this.view.tirarEspera();
      alert("Documento de confirmação '" + nomeArq + "'\nsalvo na pasta de downloads");
      
      this.view.exibirConfirmacao(cpfPaciente, nomePaciente, nomeExame, nomeExecutante, 
                                  endereco, valor, "Boleto", merchantOrderId, url);

      //window.history.go(-1);
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

"use strict";

const SEPARADOR = "##";
const funcaoMD5 = new Function("a", "return md5(a)");
const funcaoObterUsuario = new Function("b", "return usrApp.login");
const fnTirarEspera = new Function("tirarEspera()");
const fnColocarEspera = new Function("colocarEspera()");

function tiraEspacos(item) {
  if (item == null) return "";
  var pos = item.length - 1;
  while (item[pos] == " " && pos > 0) pos--;
  return item.substr(0, pos + 1);
}

var self;

export default class ViewSolicitacao {
  constructor(ctrlSolicitacao) {
    this.ctrl = ctrlSolicitacao;

    this.usrApp = null;
    self = this;

    this.tfExame = document.getElementById("tfExame");
    this.cbPaciente = document.getElementById("cbPaciente");
    this.cbExame = document.getElementById("cbExame");
    this.dtExame = document.getElementById("dtExame");
    this.cbFaturar = document.getElementById("cbFaturar");
    this.pwSenha = document.getElementById("pwSenha");
    this.btPacientes = document.getElementById("btPacientes");
    this.btConsultar = document.getElementById("btConsultar");
    this.btEnviar = document.getElementById("btEnviar");
    this.btSair = document.getElementById("btSair");

    this.divResposta = document.getElementById("divResposta");

    this.btSair.onclick = this.sair;
    this.btEnviar.onclick = this.irParaCheckout;
    this.btPacientes.onclick = this.ctrl.chamarCadastrarPacientes;
    this.btConsultar.onclick = this.obterExames;

    //---- Elementos da página de pagamento
    this.tfNomeCartao = null;
    this.tfNumCartao = null;
    this.tfMesValidade = null;
    this.tfAnoValidade = null;
    this.cbBandeira = null;
    this.tfCvv = null;
    this.btOk = null;
    this.btCancelar = null;
    //----

    this.codLocalSelecionado = null;
    this.codExecutanteSelecionado = null;
    this.codExameSelecionado = null;
    this.valorExameSelecionado = null;
    this.dtPeriodo = null;

    this.nomePaciente = null;
    this.cpfPaciente = null;
    this.dadosExame = null;
    this.dataExame = null;
    this.formaPgto = null;

    $(document).on("keypress", "input", function(e) {
      if (e.which == 13 && e.target == self.tfExame) {
        self.obterExames();
      }
    });

    this.pwSenha.addEventListener("keyup", function(event) {
      if (event.keyCode === 13) {
        this.irParaCheckout();
      }
    });
  }

  //-----------------------------------------------------------------------------------------//

  async atualizarInterface(ehMedico, arrayPacientes, arrayLocais) {
    //---- Formata a combobox de pacientes ----//
    if (ehMedico) {
      let i,
        tam = this.cbPaciente.options.length - 1;
      for (i = tam; i > 0; i--) {
        this.cbPaciente.remove(i);
      }
      await arrayPacientes.forEach(e => {
        var elem = document.createElement("option");
        elem.value = e.nome + SEPARADOR + e.cpf + SEPARADOR + e.email;
        elem.text = e.nome;
        this.cbPaciente.add(elem);
      });
    } else {
      this.cbPaciente.remove(this.cbPaciente.selectedIndex);
      this.btPacientes.hidden = true;
      this.cbPaciente.style =
        "width:100%;-webkit-appearance:none;-moz-appearance:none;text-indent:1px;text-overflow: '';";
    }
    this.dtExame.value = this.dataParaInput();

    //---- Formata a combobox de locais ----//
    let optionsLocais = await new Promise((resolve, reject) => {
      //--- var retorno = "<option value='-1'>Selecione...</option>";
      var retorno = "";
      arrayLocais.forEach((value, index, array) => {
        var codigo = value.codigolocal;
        var descricao = value.nomelocal;
        retorno += "<option value='" + codigo + "'>" + descricao + "</option>";
        if (index === array.length - 1) resolve(retorno);
      });
    });

    const divLocal = document.getElementById("divLocal");
    divLocal.innerHTML =
      "<select id='cbLocal'>" + optionsLocais + "</select></div></form>";
    $("#cbLocal")
      .select2({
        placeholder: "Selecione o local...",
        allowClear: false,
        templateResult: this.formatarLocal,
        templateSelection: this.formatarLocal
      })
      .on("select2:select", function(e) {
        this.codLocalSelecionado = e.params.data.id;
      });
    this.codLocalSelecionado = 0;
  }

  //-----------------------------------------------------------------------------------------//

  formatarLocal(item) {
    var returnString =
      "<span style='font-size: 12px; padding: 0px'>" +
      tiraEspacos(item.text) +
      "</span>";
    var novoSpan = document.createElement("span");
    novoSpan.innerHTML = returnString;
    return novoSpan;
  }

  //-----------------------------------------------------------------------------------------//

  dataParaInput() {
    const agora = new Date();
    var d = agora.getDate();
    var m = agora.getMonth() + 1;
    var y = agora.getFullYear();
    if (d < 10) d = "0" + d;
    if (m < 10) m = "0" + m;
    return y + "-" + m + "-" + d;
  }

  //-----------------------------------------------------------------------------------------//

  async obterExames() {
    fnColocarEspera();
    if (self.codLocalSelecionado == null) {
      alert("Não foi indicado o local para realização do exame.");
    }
    self.tfExame.value = self.tfExame.value.toUpperCase();
    var strExame = self.tfExame.value;
    await self.ctrl.obterExames(self.codLocalSelecionado, strExame);
    fnTirarEspera();
  }

  //-----------------------------------------------------------------------------------------//

  formatarSelecaoExame(item) {
    var returnString;
    if (item.text == "Selecione...")
      returnString =
        "<span style='font-size: 14px;'><br/><b>Selecione...</b></span>";
    else {
      var selectionText = item.text.split(SEPARADOR);
      returnString =
        "<span style='font-size: 12px;'><b>" +
        tiraEspacos(selectionText[0]) +
        "</b><br/>" +
        tiraEspacos(selectionText[1]) +
        "<br/>R$ " +
        tiraEspacos(selectionText[3]) +
        "</span>";
    }
    var novoSpan = document.createElement("span");
    novoSpan.innerHTML = returnString;
    return novoSpan;
  }

  //-----------------------------------------------------------------------------------------//

  formatarItensDeExames(item) {
    var returnString;
    if (item.text == "Selecione...")
      returnString =
        "<span style='font-size: 14px;'><b>Selecione...</b></span>";
    else {
      var selectionText = item.text.split(SEPARADOR);
      returnString =
        "<span style='font-size: 12px;'><b>" +
        tiraEspacos(selectionText[0]) +
        "</b><br/>" +
        tiraEspacos(selectionText[1]) +
        "<br/>" +
        tiraEspacos(selectionText[2]) +
        "<br/>R$ " +
        tiraEspacos(selectionText[3]) +
        "</span>";
    }
    var novoSpan = document.createElement("span");
    novoSpan.innerHTML = returnString;
    return novoSpan;
  }

  //-----------------------------------------------------------------------------------------//

  atualizarExames(arrayExames) {
    if (arrayExames == null || arrayExames.length == 0) {
      alert(
        "Nenhum exame encontrado\ncom os parâmetros informados.\nTente novamente."
      );
      return;
    }
    new Promise((res, rej) => {
      arrayExames.sort(function(a, b) {
        let keyA = a.exame;
        let keyB = b.exame;
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

      let retorno = "<option value='-1'>Selecione...</option>";
      //let retorno = "";
      arrayExames.forEach((value, index, array) => {
        let codExecutante = value.id_executante;
        let codExame = value.cd_exame;
        let valor = value.valor;
        let descricao =
          tiraEspacos(value.exame) +
          SEPARADOR +
          tiraEspacos(value.nome_executante) +
          SEPARADOR +
          tiraEspacos(value.endereco) +
          SEPARADOR +
          tiraEspacos(value.valor);
        retorno +=
          "<option value='" +
          codExecutante +
          SEPARADOR +
          codExame +
          SEPARADOR +
          valor +
          "'>" +
          descricao +
          "</option>";
        if (index === array.length - 1) res(retorno);
      });
    }).then(retorno => {
      
      const divExame = document.getElementById("divExame");

      divExame.style = "height:66px";

      divExame.innerHTML = "<select id='cbExame'>" + retorno + "</select>";
      $("#cbExame")
        .select2({
          placeholder: "Selecione os exames...",
          allowClear: false,
          templateResult: this.formatarItensDeExames,
          templateSelection: this.formatarSelecaoExame
        })
        .on("select2:select", function(e) {
          var selectionText = e.params.data.id.split(SEPARADOR);
          self.dadosExame = e.params.data;
          self.codExecutanteSelecionado = selectionText[0];
          self.codExameSelecionado = selectionText[1];
          self.valorExameSelecionado = selectionText[2];
        });

      var element = document.querySelector(
        '[aria-labelledby="select2-cbExame-container"]'
      );
      element.style = "height:56px;";

      element = document.getElementById("select2-cbExame-container");
      element.style = "line-height:16px;";
      fnTirarEspera();
    });
  }

  //-----------------------------------------------------------------------------------------//

  async irParaCheckout() {
    fnColocarEspera();
    if (self.codExecutanteSelecionado == null) {
      fnTirarEspera();
      alert("O exame não foi escolhido.");
      return;
    }
    if (self.codExameSelecionado == null) {
      fnTirarEspera();
      alert("O exame não foi escolhido.");
      return;
    }
    let solicitante = "XXXX";
    let pacienteValue = self.cbPaciente.value;
    if (pacienteValue == null || pacienteValue == "") {
      fnTirarEspera();
      alert("O paciente não foi escolhido.");
      return;
    }
    let data = self.dtExame.value;
    if (data == null) {
      fnTirarEspera();
      alert("A data não foi escolhida.");
      return;
    }
    let faturar = self.cbFaturar.value;
    if (faturar == null) {
      fnTirarEspera();
      alert("Não foi indicado se o exame será faturado ou não.");
      return;
    }
    let senha = funcaoMD5(self.pwSenha.value);
    if (senha == null) {
      fnTirarEspera();
      alert("Informe sua senha para confirmação.");
      return;
    }

    fnColocarEspera();
    if (!(await self.ctrl.verificarSenha(senha))) {
      fnTirarEspera();
      alert("Senha não confere.");
    }

    let dadosPaciente = self.cbPaciente.value.split(SEPARADOR);
    self.nomePaciente = dadosPaciente[0];
    self.cpfPaciente = dadosPaciente[1];
    self.emailPaciente = dadosPaciente[2];

    fnTirarEspera();
    alert("Procedendo checkout do pedido de exame");
    self.colocarFormPgto();
  }

  //-----------------------------------------------------------------------------------------//

  colocarFormPgto() {
    $("#divConteudo").load("pgto.html", function() {
      self.tfNomeCartao = document.getElementById("tfNomeCartao");
      self.tfNumCartao = document.getElementById("tfNumCartao");
      self.tfMesValidade = document.getElementById("tfMesValidade");
      self.tfAnoValidade = document.getElementById("tfAnoValidade");
      self.cbBandeira = document.getElementById("cbBandeira");
      self.tfCvv = document.getElementById("tfCvv");
      self.btOk = document.getElementById("btOk");
      self.btCancelar = document.getElementById("btCancelar");

      $("#tfNumCartao").mask("9999 9999 9999 9999");
      $("#tfMesValidade").mask("99");
      $("#tfAnoValidade").mask("9999");
      
      let selecao = self.dadosExame.text.split(SEPARADOR);
      let msg =
        "<center><b>Exame Solicitado:</b><br/>" +
        "<span style='font-size: 10px;'><b>" +
        tiraEspacos(selecao[0]) +
        "</b><br/>" +
        tiraEspacos(selecao[1]) +
        "<br/>" +
        tiraEspacos(selecao[2]) +
        "<br/>R$ " +
        tiraEspacos(selecao[3]) +
        "</span></center>";
      $("#divExame").html(msg);

      self.btOk.onclick = self.enviarSolicitacao;
      self.btCancelar.onclick = self.sair;
    });
  }

  //-----------------------------------------------------------------------------------------//

  enviarSolicitacao() {
    fnColocarEspera();
    
    let numCartao = self.tfNumCartao.value;
    if (numCartao == null || numCartao == "") {
      fnTirarEspera();
      alert("O número do cartão não foi informado!");
      return;
    }
    numCartao = numCartao.replace(/ /g, "");
    if (numCartao.length < 16) {
      fnTirarEspera();
      alert("O número do cartão não foi informado corretamente!");
      return;
    }
    
    let nomeCartao = self.tfNomeCartao.value;
    if (nomeCartao == null || nomeCartao == "") {
      fnTirarEspera();
      alert("O nome no cartão não foi informado!");
      return;
    }

    let bandeira = self.cbBandeira.value;
    if (bandeira == null || bandeira == "" ) {
      fnTirarEspera();
      alert("A Bandeira não foi selecionada.");
      return;
    }
    
    let mesValidade = self.tfMesValidade.value;
    if (mesValidade == null || mesValidade == "") {
      fnTirarEspera();
      alert("O mês da validade do cartão não foi informado!");
      return;
    }
    let mesInt = parseInt(mesValidade);
    if (mesInt == NaN || mesInt < 1 || mesInt > 12) {
      fnTirarEspera();
      alert("Valor inválido para o mês da validade do cartão!");
      return;
    }

    let anoValidade = self.tfAnoValidade.value;
    if (anoValidade == null || anoValidade == "") {
      fnTirarEspera();
      alert("O ano da validade do cartão não foi informado!");
      return;
    }
    let agora = new Date();
    anoValidade = parseInt(anoValidade);
    if (anoValidade == NaN || anoValidade < parseInt(agora.getFullYear())) {
      fnTirarEspera();
      alert("Cartão com validade expirada!");
      return;
    }
    if(anoValidade == parseInt(agora.getFullYear() && mesValidade < parseInt(agora.getMonth())+1)) {
      fnTirarEspera();
      alert("Cartão com validade expirada!");
      return;
    }

    let cvv = self.tfCvv.value;
    if (cvv == null || cvv == "" || cvv.length != 3) {
      fnTirarEspera();
      alert("CVV inválido!");
      return;
    }
    
    let selecao = self.dadosExame.text.split(SEPARADOR);
    let nomeExame = tiraEspacos(selecao[0]);
    let nomeExecutante = tiraEspacos(selecao[1]);
    let endereco = tiraEspacos(selecao[2]);

    self.ctrl.enviarPagamentoAgendamento(
      self.codExecutanteSelecionado,
      self.cpfPaciente.replace(/\.|-/g, ""),
      self.nomePaciente,
      self.emailPaciente,
      self.codExameSelecionado,
      self.dtExame.value,
      numCartao,
      nomeCartao,
      bandeira,
      mesValidade,
      anoValidade,
      cvv,
      nomeExame,
      nomeExecutante,
      endereco,
      self.valorExameSelecionado.replace(/\./g, ""),
    );
    fnTirarEspera();
  }

  //-----------------------------------------------------------------------------------------//

  sair() {
    history.go(-1);
  }

  //-----------------------------------------------------------------------------------------//

  colocarEspera() {
    fnColocarEspera();
  }

  //-----------------------------------------------------------------------------------------//

  tirarEspera() {
    fnTirarEspera();
  }

  //-----------------------------------------------------------------------------------------//
}

//-----------------------------------------------------------------------------------------//

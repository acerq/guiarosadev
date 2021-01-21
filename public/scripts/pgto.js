"use strict";

//-----------------------------------------------------------------------------------------//

var instalando = false;
var requestDB = null;
var db = null;
var store = null;
var transacao = null;
var usr = null;

const divInstrucao = document.getElementById("divInstrucao");
const tfNomeCartao = document.getElementById("tfNomeCartao");
const tfNumCartao = document.getElementById("tfNumCartao");
const tfMesValidade = document.getElementById("tfMesValidade");
const tfAnoValidade = document.getElementById("tfAnoValidade");
const tfCvv = document.getElementById("tfCvv");
const btOk = document.getElementById("btOk");
const btCancelar = document.getElementById("btCancelar");

var nomeCartao;
var numCartao;
var mesValidade;
var anoValidade;
var cvv;

$(document).ready(function() {
  tirarEspera();
  $("#tfNumCartao").mask("9999.9999.9999.9999");
  $("#tfMesValidade").mask("99");
  $("#tfAnoValidade").mask("9999");
  $("#tfCvv").mask("999");
});

//-----------------------------------------------------------------------------------------//

function validarMes(strMes) {
  var mes;

  mes = parseInt(strMes);
  if(mes < 1 || mes > 12)
    return false;
  return true;
}

//-----------------------------------------------------------------------------------------//

function validarAno(strAno) {
  var ano;

  ano = parseInt(strAno);
  if(ano < 2020)
    return false;
  return true;
}

//-----------------------------------------------------------------------------------------//

function validarCvv(strCvv) {
  var cvv;

  cvv = parseInt(strCvv);
  if(cvv < 0 || cvv > 999)
    return false;
  return true;
}

//-----------------------------------------------------------------------------------------//

function doPgtoCredito() {
  console.log("(pgto.js) Executando Pgto Crédito" );
  return fetch(
    "/pagarCredito/" +
      nomeCartao +
      "/" +
      numCartao +
      "/" +
      mesValidade +
      "/" +
      anoValidade +
      "/" +
      cvv, { credentials : "include" }
  )
    .then(response => {
      console.log("(pgto.js) Pgto Crédito response");
      return response.json();
    })
    .catch(() => {
      console.log("(pgto.js) Pgto Crédito catch");
      return null;
    });
}

//-----------------------------------------------------------------------------------------//

function callbackCancelar() {
  var tamHistory = window.history.length;
  while (tamHistory > 0) {
    window.history.go(-1);
    tamHistory--;
  }
}

//-----------------------------------------------------------------------------------------//

function callbackOk() {
  console.log("(cadusuario.js) callbackCriar");
  // Verificando o Nome
  nomeCartao = tfNomeCartao.value;
  if (nomeCartao == null || nomeCartao == "") {
    alert("O nome no cartão deve ser preenchido.");
    return;
  }
  numCartao = tfNumCartao.value;
  if (numCartao == null || numCartao == "") {
    alert("O número do cartão deve ser preenchido.");
    return;
  }
  // Verificando o mês de validade
  mesValidade = tfMesValidade.value;
  if (mesValidade  == null || mesValidade  == "") {
    alert("O Mês de Validade do Cartão deve ser preenchido.");
    return;
  }
  if(!validarMes(mesValidade)) {
    alert("O Mês da Validade do Cartão é inválido.");
    return;
  }
  // Verificando o ano de validade
  anoValidade = tfAnoValidade.value;
  if (anoValidade  == null || anoValidade  == "") {
    alert("O Ano de Validade do Cartão deve ser preenchido.");
    return;
  }
  if(!validarAno(anoValidade)) {
    alert("O Ano da Validade do Cartão é inválido.");
    return;
  }
  // Verificando o CVV de validade
  cvv = tfCvv.value;
  if (cvv  == null || cvv  == "") {
    alert("O CVV do Cartão deve ser preenchido.");
    return;
  }
  if(!validarCvv(cvv)) {
    alert("O CVV do Cartão é inválido.");
    return;
  }
  
  
  colocarEspera();

  // Solicita ao server.js para que execute o WS para inclusão de paciente
  doPgtoCredito().then(retorno => {
    console.log("(pgto.js) callbackOk retorno", retorno);
    if (retorno.hasOwnProperty("status")) {
      if (retorno.status == "success") {
      } else alert(retorno.erro);
    tirarEspera();
  }});
}

//-----------------------------------------------------------------------------------------//

function colocarEspera() {
  $("div.circle").addClass("wait");
}

// -----------------------------------------------------------------------------------------//

function tirarEspera() {
  $("div.circle").removeClass("wait");
}

// -----------------------------------------------------------------------------------------//btCancelar.addEventListener("click", callbackCancelar);
btOk.addEventListener("click", callbackOk);
btCancelar.addEventListener("click", callbackCancelar);

tfNomeCartao.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfNumCartao.focus();
  }
});
tfNumCartao.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfMesValidade.focus();
  }
});
tfMesValidade.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfAnoValidade.focus();
  }
});
tfAnoValidade.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfCvv.focus();
  }
});
tfCvv.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    callbackOk();
  }
});

"use strict";

// -----------------------------------------------------------------------------------------//

var requestDB = null;
var db = null;
var store = null;
var transacao = null;
var usrApp = null;

const divConteudo = document.getElementById("divConteudo");
const divInstrucao = document.getElementById("divInstrucao");
const tfLogin = document.getElementById("tfLogin");
const tfSenha = document.getElementById("tfSenha");
const btOk = document.getElementById("btOk");
const btNovo = document.getElementById("btNovo");
const labelLogin = document.getElementById("lbLogin");

var fnMD5 = new Function("a", "return md5(a)");
var estadoBtNovo = "Conta";

// -----------------------------------------------------------------------------------------//

function abrirDbApp() {
  requestDB = window.indexedDB.open("AppUsr", 1);

  requestDB.onupgradeneeded = event => {
    db = event.target.result;
    store = db.createObjectStore("AppUsr", {
      autoIncrement: true
    });
    store.createIndex("login", "login", { unique: true });
  };

  requestDB.onerror = event => {
    alert("Erro [AppUsr]: " + event.target.errorCode);
  };

  requestDB.onsuccess = event => {
    db = event.target.result;
    obterAppUsr();
  };
}

// -----------------------------------------------------------------------------------------//

function obterAppUsr() {
  try {
    transacao = db.transaction(["AppUsr"], "readonly");
    store = transacao.objectStore("AppUsr");
  } catch (e) {
    instalacaoApp();
    return;
  }
  store.openCursor().onsuccess = event => {
    var cursor = event.target.result;
    if (cursor) {
      usrApp = cursor.value;
      tfLogin.value = usrApp.login;
      tfLogin.disabled = true;
      btNovo.textContent = "Novo Login";
      estadoBtNovo = "Login";

      if (usrApp.ehMedico == true) {
        labelLogin.innerHTML = "Login (Médico):";
      } else {
        labelLogin.innerHTML = "CPF:";
      }
    } else {
      tfLogin.disabled = false;
      btNovo.textContent = "Nova Conta";
      estadoBtNovo = "Conta";
      instalacaoApp();
    }
  };
}

// -----------------------------------------------------------------------------------------//

function incluirDbApp(
  login,
  senha,
  nome,
  email,
  celular,
  rua,
  numero,
  complemento,
  bairro,
  cep,
  ehMedico
) {
  transacao = db.transaction(["AppUsr"], "readwrite");
  transacao.onerror = event => {
    alert("Erro [AppUsr]: " + event.target.errorCode);
  };
  store = transacao.objectStore("AppUsr");
  var objectStoreRequest = store.clear();
  objectStoreRequest.onsuccess = function(event) {
    objectStoreRequest = store.add({
      login: login,
      senha: fnMD5(senha),
      nome: nome,
      email: email,
      celular: celular,
      rua: rua,
      numero: numero,
      complemento: complemento,
      bairro: bairro,
      cep: cep,
      ehMedico: ehMedico
    });
    objectStoreRequest.onsuccess = function(event) {
      window.location.href = "inicio.html";
    };
  };
}

// -----------------------------------------------------------------------------------------//

function instalacaoApp() {
  divInstrucao.innerHTML =
    "<center><b>Efetue seu Login ou Crie sua Conta</b></center>";
}

// -----------------------------------------------------------------------------------------//

function renderEfetuarLogin(resposta) {
  if (resposta == null) {
    alert("Problemas de Conexão com o Servidor");
    return;
  }
  if (resposta.hasOwnProperty("erro")) {
    alert(resposta.erro);

    if (resposta.erro.includes("TIMEOUT")) {
      divInstrucao.innerHTML =
        "<b>Tempo de Conexão Excedido<br/>com o Servidor. Tente mais tarde.</b>";
      return;
    }

    if (
      usrApp == null ||
      tfLogin.value != usrApp.login ||
      fnMD5(tfSenha.value) != usrApp.senha
    ) {
      divInstrucao.innerHTML = "<b>Login não autorizado</b>";
      return;
    }
  }

  if (tfLogin.value.replace(/\.|-/g, "") == usrApp.login.replace(/\.|-/g, "") && fnMD5(tfSenha.value) == usrApp.senha) {
    incluirDbApp(
      usrApp.login,
      usrApp.senha,
      usrApp.nome,
      usrApp.email,
      usrApp.celular,
      usrApp.rua,
      usrApp.numero,
      null,
      null,
      null,
      true
    );
    window.location.href = "inicio.html";
    //doGuardarUsuarioCorrente().then(retorno => {
    //  return;
    //});
  }
}

// -----------------------------------------------------------------------------------------//

function doGuardarUsuarioCorrente() {
  return fetch(
    "/guardarUsuarioCorrente/" +
      usrApp.login +
      "/" +
      usrApp.senha +
      "/" +
      usrApp.nome +
      "/" +
      usrApp.email +
      "/" +
      usrApp.celular +
      "/" +
      usrApp.rua +
      "/" +
      usrApp.numero +
      "/" +
      usrApp.complemento +
      "/" +
      usrApp.bairro +
      "/" +
      usrApp.cep,
    {
      credentials: "include"
    }
  )
    .then(response => {
      return response.json();
    })
    .catch(() => {
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

async function doEfetuarLogin(login, senha) {
  if (usrApp != null && login == usrApp.login) {
    if (senha == usrApp.senha) {
      return usrApp;
    }
  }
  let response = await fetch("/login/" + login + "/" + senha, { credentials : "include" } );
  let respJson = await response.json();
  usrApp = respJson;
  return respJson;
}

// -----------------------------------------------------------------------------------------//

async function callbackOk() {
  const login = tfLogin.value;
  const senha = fnMD5(tfSenha.value);

  colocarEspera();
  // chama efetuarLogin e atualiza a tela
  let retorno = await doEfetuarLogin(login, senha);
  renderEfetuarLogin(retorno);
  retirarEspera();
}

// -----------------------------------------------------------------------------------------//

function callbackCriar() {
  if (estadoBtNovo == "Conta") window.location.href = "cadusuario.html";
  else {
    // estadoBtNovo == "Login";
    labelLogin.innerHTML = "Login:";
    tfLogin.value = "";
    tfLogin.disabled = false;
    btNovo.textContent = "Nova Conta";
    estadoBtNovo = "Conta";
    divInstrucao.innerHTML =
      "<center><b>Efetue seu Login ou Crie sua Conta</b></center>";
  }
}

// -----------------------------------------------------------------------------------------//

function colocarEspera() {
  $("div.circle").addClass("wait");
}

// -----------------------------------------------------------------------------------------//

function retirarEspera() {
  $("div.circle").removeClass("wait");
}

// -----------------------------------------------------------------------------------------//

btOk.addEventListener("click", callbackOk);
btNovo.addEventListener("click", callbackCriar);
tfSenha.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    callbackOk();
  }
});

abrirDbApp();
"use strict";

// -----------------------------------------------------------------------------------------//

var instalando = false;
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

var fnMD5 = new Function('a', 'return md5(a)');
var estadoBtNovo = "Conta";

// -----------------------------------------------------------------------------------------//

function initApp() {
  console.log("init");
  // Registrando o service worker.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").then(reg => {
        console.log("Service worker registrado", reg);
      });
    });
  }
  abrirDbApp();
}

// -----------------------------------------------------------------------------------------//

function abrirDbApp() {
  requestDB = window.indexedDB.open("AppUsr", 1);

  requestDB.onupgradeneeded = event => {
    console.log("[app usr] Criando IndexedDB AppUsr");
    db = event.target.result;
    store = db.createObjectStore("AppUsr", {
      autoIncrement: true
    });
    store.createIndex("login", "login", { unique: true });
  };

  requestDB.onerror = event => {
    console.log("Erro [AppUsr]: " + event.target.errorCode);
    alert("Erro [AppUsr]: " + event.target.errorCode);
  };

  requestDB.onsuccess = event => {
    console.log("[AppUsr] Sucesso");
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
    console.log("[AppUsr] Erro");
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
      
      if(usrApp.ehMedico == true) {
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

function incluirDbApp(login, senha, nome, email, celular, endereco, ehMedico) {
  transacao = db.transaction(["AppUsr"], "readwrite");
  transacao.oncomplete = event => {
    console.log("[AppUsr] Sucesso");
  };
  transacao.onerror = event => {
    console.log("[AppUsr] Erro");
  };
  store = transacao.objectStore("AppUsr");
  var objectStoreRequest = store.clear();
  objectStoreRequest.onsuccess = function(event) {
	  objectStoreRequest = store.add({
		  login: login,
		  senha: fnMD5(senha),
		  nome: nome,
		  email: email,
		  celular : celular,
		  endereco : endereco,
		  ehMedico: ehMedico
	  });
	  objectStoreRequest.onsuccess = function(event) {
		  window.location.href = 'inicio.html';
	  }
   };
}

// -----------------------------------------------------------------------------------------//

function instalacaoApp() {
  instalando = true;
  divInstrucao.innerHTML =
    "<center><b>Efetue seu Login ou Crie sua Conta</b></center>";
}

// -----------------------------------------------------------------------------------------//

function renderEfetuarLogin(data) {
  if (data == null) {
    console.log("renderEfetuarLogin no data");
    alert("Problemas de Conexão com o Servidor");
    return;
  }
  console.log("renderEfetuarLogin -> ", data);
  if (data.hasOwnProperty("erro")) {
    alert(data.erro);
    retirarEspera();
    if(data.erro.includes("TIMEOUT")) {
      divInstrucao.innerHTML = "<b>Tempo de Conexão Excedido<br/>com o Servidor. Tente mais tarde.</b>";     
      return;
    }
    
    if(usrApp == null || tfLogin.value != usrApp.login || fnMD5(tfSenha.value) != usrApp.senha) {
      alert(data.erro);
      divInstrucao.innerHTML = "<b>Login não autorizado</b>";     
      return;
    }
    if(tfLogin.value == usrApp.login && fnMD5(tfSenha.value) == usrApp.senha) {
      doDeterminarUsuarioLocal().then(retorno => {
        console.log("callbackCriarUsuario retorno", retorno);
        window.location.href = "inicio.html";
        return;
      });
    } 
  }

  if (data.hasOwnProperty("status")) {
    if (data.status == "success") {
        incluirDbApp(
          tfLogin.value,
          null,
          data.nome,
          null,
          null,
          null,
          true 
        );
    }
  }
}

// -----------------------------------------------------------------------------------------//

function doDeterminarUsuarioLocal() {
  console.log("(app.js) Executando Determinar Usuário Local ");
  return fetch(
    "/determinarUsuarioLocal/" +
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
      usrApp.endereco
  )
    .then(response => {
      console.log("(app.js) determinarUsuarioLocal response");
      return response.json();
    })
    .catch(() => {
      console.log("(app.js) determinarUsuarioLocal catch");
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

function doEfetuarLogin(login, senha) {
  console.log("(app.js) Executando efetuarLogin " + login + " " + senha);
  return fetch("/login/" + login + "/" + fnMD5(senha))
    .then(response => {
      console.log("(app.js) efetuarLogin response");
      return response.json();
    })
    .catch(() => {
      console.log("(app.js) efetuarLogin catch");
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

function callbackOk() {
  console.log("(app.js) callbackOk");
  const login = tfLogin.value;
  const senha = tfSenha.value;

  colocarEspera();
  // chama efetuarLogin e atualiza a tela
  doEfetuarLogin(login, senha).then(retorno => {
    console.log("callbackOk retorno", retorno);
    renderEfetuarLogin(retorno);
  });
}

// -----------------------------------------------------------------------------------------//

function callbackCriar() {
  if(estadoBtNovo == "Conta") 
	  window.location.href = "cadusuario.html";
  else {
	  // estadoBtNovo == "Login";
	  labelLogin.innerHTML = "Login:";
      tfLogin.value = "";
      tfLogin.disabled = false;
      btNovo.textContent = "Nova Conta";
      estadoBtNovo = "Conta";
      divInstrucao.innerHTML = "<center><b>Efetue seu Login ou Crie sua Conta</b></center>";
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
tfSenha.addEventListener("keyup", function(event){if(event.keyCode === 13){callbackOk();}});

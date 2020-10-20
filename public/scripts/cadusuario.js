"use strict";

//-----------------------------------------------------------------------------------------//

var instalando = false;
var requestDB = null;
var db = null;
var store = null;
var transacao = null;
var usr = null;

const divConteudo = document.getElementById("divConteudo");
const divInstrucao = document.getElementById("divInstrucao");
const tfCpf = document.getElementById("tfCpf");
const tfNome = document.getElementById("tfNome");
const tfSenha = document.getElementById("tfSenha");
const tfReplay = document.getElementById("tfReplay");
const tfCelular = document.getElementById("tfCelular");
const tfEmail = document.getElementById("tfEmail");
const tfEndereco = document.getElementById("tfEndereco");
const btCancelar = document.getElementById("btCancelar");
const btCriar = document.getElementById("btCriar");

var cpf;
var nome;
var senha;
var replay;
var email;
var celular;
var endereco;

var funcaoMD5 = new Function("a", "return md5(a)");

$(document).ready(function() {
  tirarEspera();
  $("#tfCpf").mask("999.999.999-99");
  $("#tfCelular").mask("(99) 9999-9999?9");
});

//-----------------------------------------------------------------------------------------//

function validarCpf(strCpf) {
  var soma;
  var resto;
  var i;

  soma = 0;
  strCpf = strCpf.replace(".", "");
  strCpf = strCpf.replace(".", "");
  strCpf = strCpf.replace("-", "");

  if (strCpf == "00000000000") return false;

  for (i = 1; i <= 9; i++)
    soma = soma + parseInt(strCpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;

  if (resto == 10 || resto == 11) resto = 0;
  if (resto != parseInt(strCpf.substring(9, 10))) return false;

  soma = 0;
  for (i = 1; i <= 10; i++)
    soma = soma + parseInt(strCpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;

  if (resto == 10 || resto == 11) resto = 0;
  if (resto != parseInt(strCpf.substring(10, 11))) return false;
  return true;
}

//-----------------------------------------------------------------------------------------//

function abrirDbApp() {
  // Verificações
  console.log("(cadusuario.js) abrirDbApp iniciando...");

  requestDB = window.indexedDB.open("AppUsr", 1);

  requestDB.onupgradeneeded = event => {
    console.log("(cadusuario.js) Criando IndexedDB AppUsr");
    db = event.target.result;
    store = db.createObjectStore("AppUsr", {
      autoIncrement: true
    });
    store.createIndex("login", "login", { unique: true });
  };

  requestDB.onerror = event => {
    tirarEspera();
    console.log("(cadusuario.js) Erro [AppUsr]: " + event.target.errorCode);
    alert("(cadusuario.js) Erro [AppUsr]: " + event.target.errorCode);
  };

  requestDB.onsuccess = event => {
    tirarEspera();
    console.log("(cadusuario.js) [AppUsr] Sucesso");
    db = event.target.result;
    senha = tfSenha.value;
    cpf = tfCpf.value;
    nome = tfNome.value;
    email = tfEmail.value;
    celular = tfCelular.value;
    endereco = tfEndereco.value;

    incluirDbApp();
  };
}

//-----------------------------------------------------------------------------------------//

function incluirDbApp() {
  transacao = db.transaction(["AppUsr"], "readwrite");
  transacao.oncomplete = event => {
    console.log("(cadusuario.js) [AppUsr] Sucesso");
  };
  transacao.onerror = event => {
    console.log("(cadusuario.js) [AppUsr] Erro");
  };
  store = transacao.objectStore("AppUsr");
  var objectStoreRequest = store.clear();
  objectStoreRequest.onsuccess = function(event) {
    db = event.target.result;
    objectStoreRequest = store.add({
      login: cpf,
      senha: funcaoMD5(senha),
      nome: nome,
      email: email,
      celular: celular,
      endereco: celular,
      ehMedico: false
    });
    objectStoreRequest.onsuccess = function(event) {
      window.location.href = "inicio.html";
    };
  };
}

//-----------------------------------------------------------------------------------------//

function renderCriarUsuario(data) {}

//-----------------------------------------------------------------------------------------//

function doIncluirPaciente() {
  console.log("(cadusuario.js) Executando Incluir Paciente " + cpf);
  return fetch(
    "/incluirPaciente/" +
      cpf.replace(/\.|-/g, "") +
      "/" +
      nome +
      "/" +
      funcaoMD5(senha) +
      "/" +
      email +
      "/" +
      celular.replace(/\(|\)|\s|-/g, "") +
      "/" +
      endereco
  )
    .then(response => {
      console.log("(cadusuario.js) incluirPaciente response");
      return response.json();
    })
    .catch(() => {
      console.log("(cadusuario.js) incluirPaciente catch");
      return null;
    });
}

//-----------------------------------------------------------------------------------------//

function doGuardarUsuarioCorrente() {
  console.log("(cadusuario.js) Executando Guardar Usuário Corrente " + cpf);
  return fetch(
    "/guardarUsuarioCorrente/" +
      cpf +
      "/" +
      funcaoMD5(senha) +
      "/" +
      nome +
      "/" +
      email +
      "/" +
      celular +
      "/" +
      endereco
  )
    .then(response => {
      console.log("(cadusuario.js) doGuardarUsuarioCorrente response");
      return response.json();
    })
    .catch(() => {
      console.log("(cadusuario.js) doGuardarUsuarioCorrente catch");
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

function callbackCriar() {
  console.log("(cadusuario.js) callbackCriar");
  // Verificando o Cpf
  cpf = tfCpf.value;
  if (cpf == null || cpf == "") {
    alert("O CPF deve ser preenchido.");
    return;
  }
  if (!validarCpf(cpf)) {
    alert("O CPF informado é inválido.");
    return;
  }
  // Verificando o nome
  nome = tfNome.value;
  if (nome == null || nome == "") {
    alert("O nome deve ser preenchido.");
    return;
  }
  // Verificando o celular
  celular = tfCelular.value;
  if (celular == null || celular == "") {
    alert("O celular deve ser preenchido.");
    return;
  }
  // Verificando o email
  email = tfEmail.value;
  if (email == null || email == "") {
    alert("O email deve ser preenchido.");
    return;
  }
  const padrao = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9-]+.[a-zA-Z]{2,4}/;
  if (!padrao.test(email)) {
    alert("O email é inválido.");
    return;
  }
  // Verificando a senha
  senha = tfSenha.value;
  if (senha == null || senha == "") {
    alert("A senha deve ser preenchida.");
    return;
  }
  if (senha.length < 6) {
    alert("A senha deve pelo menos 6 caracteres.");
    return;
  }
  // Verificando o replay da senha
  replay = tfReplay.value;
  if (replay == null || replay == "") {
    alert("A repetição da senha deve ser preenchida.");
    return;
  }
  if (senha != replay) {
    alert("A repetição da senha está divergente da senha informada.");
    return;
  }

  // Verificando o endereço
  endereco = tfEndereco.value;
  if (endereco == null || endereco == "") {
    alert("O endereço deve ser preenchido.");
    return;
  }

  colocarEspera();

  // Solicita ao server.js para que execute o WS para inclusão de paciente
  doIncluirPaciente().then(retorno => {
    console.log("(cadusuario.js) callbackCriar retorno", retorno);
    if (retorno.hasOwnProperty("status")) {
      if (retorno.status == "success") {
        // Guarda os dados no banco local
        abrirDbApp();
        // Solicita ao server.js para guardar os dados do usuário
        doGuardarUsuarioCorrente().then(retorno => {
          console.log("(cadusuario.js) callbackCriar retorno", retorno);
          renderCriarUsuario(retorno);
        });
      } else alert(retorno.msg);
    } else alert(retorno.erro);
    tirarEspera();
  });
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
btCriar.addEventListener("click", callbackCriar);
btCancelar.addEventListener("click", callbackCancelar);

tfCpf.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfNome.focus();
  }
});
tfNome.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfCelular.focus();
  }
});
tfCelular.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfEmail.focus();
  }
});
tfEmail.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfEndereco.focus();
  }
});
tfEmail.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfSenha.focus();
  }
});
tfSenha.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfReplay.focus();
  }
});
tfReplay.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    callbackCriar();
  }
});

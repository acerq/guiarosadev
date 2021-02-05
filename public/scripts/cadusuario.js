"use strict";

//-----------------------------------------------------------------------------------------//

var instalando = false;
var requestDB = null;
var db = null;
var store = null;
var transacao = null;
var usr = null;

const divInstrucao = document.getElementById("divInstrucao");

const tfCpf = document.getElementById("tfCpf");
const tfNome = document.getElementById("tfNome");
const tfSenha = document.getElementById("tfSenha");
const tfReplay = document.getElementById("tfReplay");
const tfCelular = document.getElementById("tfCelular");
const tfEmail = document.getElementById("tfEmail");
const tfRua = document.getElementById("tfRua");
const tfNumero = document.getElementById("tfNumero");
const tfComplemento = document.getElementById("tfComplemento");
const tfBairro = document.getElementById("tfBairro");
const tfCidade = document.getElementById("tfCidade");
const tfUf = document.getElementById("tfUf");
const tfCep = document.getElementById("tfCep");

const btCancelar = document.getElementById("btCancelar");
const btCriar = document.getElementById("btCriar");

var cpf;
var nome;
var senha;
var replay;
var email;
var celular;
var rua;
var numero;
var complemento;
var bairro;
var cep;



var funcaoMD5 = new Function("a", "return md5(a)");

$(document).ready(function() {
  
  // Tratando evento voltar
  if(tfCpf.value != null && tfCpf.value != "") {
    let tamHistory = window.history.length;
    if(tamHistory == 0)
      window.location.href='index.html';
    else
      while (tamHistory > 0) {
        window.history.go(-1);
        tamHistory--;
      }
  }
  
  tirarEspera();
  $("#tfCpf").mask("999.999.999-99");
  $("#tfCelular").mask("(99) 9999-9999?9");
  $("#tfCep").mask("99999-999");
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
  requestDB = window.indexedDB.open("AppUsr", 1);

  requestDB.onupgradeneeded = event => {
    db = event.target.result;
    store = db.createObjectStore("AppUsr", {
      autoIncrement: true
    });
    store.createIndex("login", "login", { unique: true });
  };

  requestDB.onerror = event => {
    tirarEspera();
    alert("Erro [abrirBD]: " + event.target.errorCode);
  };

  requestDB.onsuccess = event => {
    tirarEspera();
    db = event.target.result;
    senha = tfSenha.value;
    cpf = tfCpf.value;
    nome = tfNome.value;
    email = tfEmail.value;
    celular = tfCelular.value;
    rua = tfRua.value;
    numero = tfNumero.value;
    complemento = tfComplemento.value;
    bairro = tfBairro.value;
    cep = tfCep.value;
    incluirDbApp();
  };
}

//-----------------------------------------------------------------------------------------//

function incluirDbApp() {
  transacao = db.transaction(["AppUsr"], "readwrite");
  transacao.oncomplete = event => {};
  transacao.onerror = event => {
    alert("Problemas de Conexão com o servidor: " + event.target.errorCode);
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
      rua: rua,
      numero: numero,
      complemento: complemento,
      bairro: bairro,
      cep: cep,
      ehMedico: false
    });
    objectStoreRequest.onsuccess = function(event) {
      window.location.href = "inicio.html";
    };
  };
}

//-----------------------------------------------------------------------------------------//

async function getEnderecoPeloCep(cep) {
  colocarEspera();
  let response = await fetch('/obterEnderecoPeloCep/' + cep);
  let dados = await response.json();
  if(dados.resultado == "1") {
    tfRua.value = dados.tipo_logradouro + " " + dados.logradouro;
    tfBairro.value = dados.bairro;
    tfUf.value = dados.uf;
    tfCidade.value = dados.cidade;
  } else
    alert("CEP Não Encontrado: " + cep);
  tirarEspera();
}

//-----------------------------------------------------------------------------------------//
async function doIncluirUsuarioPaciente() {
  let response = await fetch(
    "/incluirUsuarioPaciente/" +
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
      rua +
      "/" +
      numero +
      "/" +
      complemento +
      "/" +
      bairro +
      "/" +
      cep, { credentials : "include" }
  );
  return await response.json();
}

//-----------------------------------------------------------------------------------------//

function doGuardarUsuarioCorrente() {
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
      rua +
      "/" +
      numero +
      "/" +
      complemento +
      "/" +
      bairro +
      "/" +
      cep, { credentials : "include" }
  )
    .then(response => {
      return response.json();
    })
    .catch(() => {
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

async function callbackCriar() {
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
  rua = tfRua.value;
  if (rua == null || rua == "") {
    alert("A rua do endereço deve ser preenchida.");
    return false;
  }

  numero = tfNumero.value;
  if (numero == null || numero == "") {
    alert("O número do endereço deve ser preenchido.");
    return false;
  }

  const padraoNum = /[0-9]/;
  if (!padraoNum.test(numero)) {
    alert("O número do endereço é inválido.");
    return false;
  }

  complemento = tfComplemento.value;
  if (complemento == null || complemento == "") {
    complemento = "null";
  }

  bairro = tfBairro.value;
  if (bairro == null || bairro == "") {
    alert("O bairro deve ser preenchido.");
    return false;
  }

  cep = tfCep.value;
  if (cep == null || cep == "") {
    alert("O CEP deve ser preenchido.");
    return false;
  }

  colocarEspera();

  // Solicita ao server.js para que execute o WS para inclusão de paciente
  let retorno = await doIncluirUsuarioPaciente();
  if (retorno.hasOwnProperty("session_id")) {
    // Guarda os dados no banco local
    abrirDbApp();
  }  
  else 
    alert(retorno.erro);
  tirarEspera();
}

//-----------------------------------------------------------------------------------------//

function colocarEspera() {
  $("div.circle").addClass("wait");
}

// -----------------------------------------------------------------------------------------//

function tirarEspera() {
  $("div.circle").removeClass("wait");
}

// -----------------------------------------------------------------------------------------//

btCancelar.addEventListener("click", callbackCancelar);
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
    tfCep.focus();
  }
});
tfCep.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    getEnderecoPeloCep(tfCep.value);
    tfNumero.focus();
  }
});
tfCep.addEventListener("blur", function(event) {
    getEnderecoPeloCep(tfCep.value);
    tfNumero.focus();
});
tfNumero.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    tfComplemento.focus();
  }
});
tfComplemento.addEventListener("keyup", function(event) {
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


"use strict";

// -----------------------------------------------------------------------------------------//

const novoDaoUsuario = new Function("", "return new DaoUsuario()");
const novaViewEfetuarLogin = new Function("ctrl", "return new ViewEfetuarLogin(ctrl)");
const fnMD5 = new Function("a", "return md5(a)");

// -----------------------------------------------------------------------------------------//

function UcEfetuarLogin() {
  this.viewEfetuarLogin = novaViewEfetuarLogin(this);
  this.usrApp = null;
  this.daoUsuario = novoDaoUsuario();
  this.iniciar();
}

// -----------------------------------------------------------------------------------------//

UcEfetuarLogin.prototype.iniciar = async function() {
  await this.daoUsuario.abrirDb();
  this.usrApp = await this.daoUsuario.obterUsr();
  this.viewEfetuarLogin.iniciar(this.usrApp);
}

// -----------------------------------------------------------------------------------------//

UcEfetuarLogin.prototype.verificarLogin = async function(login, senha) {
  if (this.usrApp != null && this.usrApp.login == login && !this.usrApp.ehMedico) {
    if (this.usrApp.senha == fnMD5(senha)) {        
      return this.usrApp;
    } 
    //TODO não é médico e a senha não é a mesma
  }
  let response = await fetch("/login/" + login + "/" + fnMD5(senha), { credentials : "include" } );
  let respJson = await response.json();
  
  if(respJson == null) {
    this.viewEfetuarLogin.notificar("Problemas de Conexão com o Servidor");
    return false;
  }
  if(respJson.hasOwnProperty("erro")) {
    this.viewEfetuarLogin.notificar(respJson.erro);
    
    if(respJson.erro.includes("TIMEOUT")) {
      this.viewEfetuarLogin.colocarInstrucao("<b>Tempo de Conexão Excedido<br/>com o Servidor. Tente mais tarde.</b>");
      return false;
    }

    if(respJson == null || login != this.usrApp.login || fnMD5(senha) != this.usrApp.senha) {
      this.viewEfetuarLogin.colocarInstrucao("<b>Login não autorizado</b>");
      return;
    }
  }
  
  this.usrApp = respJson; 
  this.daoUsuario.salvarUsr(this.usrApp.login, this.usrApp.senha, this.usrApp.nome, this.usrApp.email, 
                            this.usrApp.celular, this.usrApp.rua, this.usrApp.numero, this.usrApp.complemento, 
                            this.usrApp.bairro, this.usrApp.cep, this.usrApp.ehMedico);
  
  //if(login.replace(/\.|-/g, "") == this.usrApp.login.replace(/\.|-/g, "") && 
  //fnMD5(tfSenha.value) == usrApp.senha) 
  
  return true;
}

// -----------------------------------------------------------------------------------------//

UcEfetuarLogin.prototype.guardarUsuarioCorrente = function() {
  return fetch(
    "/guardarUsuarioCorrente/" +
      this.usrApp.login +
      "/" +
      this.usrApp.senha +
      "/" +
      this.usrApp.nome +
      "/" +
      this.usrApp.email +
      "/" +
      this.usrApp.celular +
      "/" +
      this.usrApp.rua +
      "/" +
      this.usrApp.numero +
      "/" +
      this.usrApp.complemento +
      "/" +
      this.usrApp.bairro +
      "/" +
      this.usrApp.cep,
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

new UcEfetuarLogin();

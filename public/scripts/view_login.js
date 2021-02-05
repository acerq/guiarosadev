"use strict";

// -----------------------------------------------------------------------------------------//
var self;

function ViewEfetuarLogin(ctrl) {
  self = this;
  this.ctrlEfetuarLogin = ctrl;
  this.estadoBtNovo = "Login";
  this.divConteudo = document.getElementById("divConteudo");
  this.divInstrucao = document.getElementById("divInstrucao");
  this.tfLogin = document.getElementById("tfLogin");
  this.tfSenha = document.getElementById("tfSenha");
  this.btOk = document.getElementById("btOk");
  this.btNovo = document.getElementById("btNovo");
  this.labelLogin = document.getElementById("lbLogin");
  
  this.btOk.addEventListener("click", this.callbackOk);
  this.btNovo.addEventListener("click", this.callbackCriar);
  this.tfSenha.addEventListener("keyup", function(event) {
    if(event.keyCode === 13) {
      self.callbackOk();
    }
  });
}

// -----------------------------------------------------------------------------------------//

ViewEfetuarLogin.prototype.iniciar = async function(usrApp) {
  if(usrApp != null) {
    this.tfLogin.value = usrApp.login;
    this.tfLogin.disabled = true;
    this.btNovo.textContent = "Novo Login";
    this.estadoBtNovo = "Login";

    if (usrApp.ehMedico == true) {
      this.labelLogin.innerHTML = "Login (Médico):";
    } else {
      this.labelLogin.innerHTML = "CPF:";
    }  
  }
  else {
    this.tfLogin.disabled = false;
    this.btNovo.textContent = "Nova Conta";
    this.estadoBtNovo = "Conta";
    this.instalacaoApp();
  }
}

// -----------------------------------------------------------------------------------------//

ViewEfetuarLogin.prototype.instalacaoApp = function() {
  this.divInstrucao.innerHTML =
    "<center><b>Efetue seu Login ou Crie sua Conta</b></center>";
}

// -----------------------------------------------------------------------------------------//

ViewEfetuarLogin.prototype.callbackOk = async function() {
  self.colocarEspera();
  let ok = await self.ctrlEfetuarLogin.verificarLogin(self.tfLogin.value, self.tfSenha.value);
  self.retirarEspera();
  if(ok) 
    window.location.href = "inicio.html";
}

// -----------------------------------------------------------------------------------------//

ViewEfetuarLogin.prototype.callbackCriar = function () {
  if (self.estadoBtNovo == "Conta") 
    window.location.href = "cadusuario.html";
  else {
    // estadoBtNovo == "Login";
    self.labelLogin.innerHTML = "Login:";
    self.tfLogin.value = "";
    self.tfLogin.disabled = false;
    self.btNovo.textContent = "Nova Conta";
    self.estadoBtNovo = "Conta";
    self.colocarInstrucao("<center><b>Efetue seu Login ou Crie sua Conta</b></center>");
  }
}

// -----------------------------------------------------------------------------------------//

ViewEfetuarLogin.prototype.colocarEspera = function() {
  $("div.circle").addClass("wait");
}

// -----------------------------------------------------------------------------------------//

ViewEfetuarLogin.prototype.retirarEspera = function() {
  $("div.circle").removeClass("wait");
}

// -----------------------------------------------------------------------------------------//

ViewEfetuarLogin.prototype.notificar = function(msg) {
  alert(msg);
}

// -----------------------------------------------------------------------------------------//

ViewEfetuarLogin.prototype.colocarInstrucao = function(msg) {
  this.divInstrucao.innerHTML = msg;

}

// -----------------------------------------------------------------------------------------//

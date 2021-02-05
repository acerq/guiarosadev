"use strict";

function DaoUsuario() {
  this.db = null;
}

//-----------------------------------------------------------------------------------------//

DaoUsuario.prototype.abrirDb = async function() {
  this.db = await new Promise(function(resolve, reject) {
    let requestDB = window.indexedDB.open("AppUsr", 1);
    requestDB.onupgradeneeded = event => {
      console.log("Criando IndexedDB AppUsr");
      let db = event.target.result;
      let store = db.createObjectStore("AppUsr", {
        autoIncrement: true
      });
      store.createIndex("login", "login", { unique: true });
    };

    requestDB.onerror = event => {
      alert("Erro [DBConsulta]: " + event.target.errorCode);
      reject(Error("Error: " + event.target.errorCode));
    };

    requestDB.onsuccess = event => {
      console.log("[DBConsulta] Sucesso");
      if (event.target.result) {
        resolve(event.target.result);
      }
      else
        reject(Error("object not found"));
    };
  });
  
};

//-----------------------------------------------------------------------------------------//

DaoUsuario.prototype.obterUsr = async function() {
  let self = this;
  let resultado = await new Promise(function(resolve, reject) {
    try {
      let transacao = self.db.transaction(["AppUsr"], "readonly");
      let store = transacao.objectStore("AppUsr");
      let array = [];
      store.openCursor().onsuccess = event => {
        let cursor = event.target.result;
        if (cursor) 
          resolve(cursor.value);
        else 
          resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
  return resultado;
};

//-----------------------------------------------------------------------------------------//

DaoUsuario.prototype.salvarUsr = async function(login, senha, nome, email, celular, rua, numero,
                                                complemento, bairro, cep, ehMedico){

  let self = this;
  let resultado = await new Promise(async function(resolve, reject) {
    try {
      let transacao = self.db.transaction(["AppUsr"], "readwrite");
      let store = transacao.objectStore("AppUsr");
      let request = await store.add({
        login: login,
        senha: senha,
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
      transacao.oncomplete = function(event) {
        resolve(true);
      };
      transacao.onerror = function(event) {
        resolve(false);
      };
    } catch (e) {
        resolve(false);
    }
  });
  return resultado;
};

//-----------------------------------------------------------------------------------------//

DaoUsuario.prototype.limparDb = function() {
  var requestDB = window.indexedDB.deleteDatabase("AppUsr", 1);
  requestDB.onsuccess = function(event) {};
  requestDB.onerror = function(event) {};
};

//-----------------------------------------------------------------------------------------//


"use strict";

function DaoConsulta() {
  this.db = null;
}

//-----------------------------------------------------------------------------------------//

DaoConsulta.prototype.abrirDbConsulta = async function() {
  this.db = await new Promise(function(resolve, reject) {
    let requestDB = window.indexedDB.open("ConsultaUsr", 1);
    requestDB.onupgradeneeded = event => {
      console.log("Criando IndexedDB Consulta");
      let db = event.target.result;
      let store = db.createObjectStore("Consulta", {
        autoIncrement: true
      });
      store.createIndex("id", "id", { unique: true });
    };

    requestDB.onerror = event => {
      alert("Erro [DBConsulta]: " + event.target.errorCode);
      reject(Error("Error: " + event.target.errorCode));
    };

    requestDB.onsuccess = event => {
      console.log("[DBConsulta] Sucesso");
      if (event.target.result) resolve(event.target.result);
      else reject(Error("object not found"));
    };
  });
};

//-----------------------------------------------------------------------------------------//

DaoConsulta.prototype.salvarConsulta = async function(codLocalSelecionado, arrayExames, tfExame, idDadosExame, codExecutanteSelecionado, codExameSelecionado) {
  let self = this;
  let resultado = await new Promise(async function(resolve, reject) {
    try {
      let transacao = self.db.transaction(["Consulta"], "readwrite");
      let store = transacao.objectStore("Consulta");
      let request = await store.add({
        id: 1,
        codLocalSelecionado: codLocalSelecionado,
        arrayExames: arrayExames,
        tfExame: tfExame,
        idDadosExame : idDadosExame,
        codExecutanteSelecionado: codExecutanteSelecionado,
        codExameSelecionado: codExameSelecionado
      });
      transacao.oncomplete = function(event) {
        resolve("Ok");
      };
      transacao.onerror = function(event) {
        resolve([]);
      };
      // resolve("Ok");
    } catch (e) {
      console.log("salvarConsulta: " + e);
      resolve([]);
    }
  });
  return resultado;
};

//-----------------------------------------------------------------------------------------//

DaoConsulta.prototype.limparConsulta = function() {
  var requestDB = window.indexedDB.deleteDatabase("ConsultaUsr", 1);
  requestDB.onsuccess = function(event) {};
  requestDB.onerror = function(event) {};
};

//-----------------------------------------------------------------------------------------//

DaoConsulta.prototype.verificarConsultaArmazenada = async function() {
  let self = this;
  let resultado = await new Promise(function(resolve, reject) {
    try {
      let transacao = self.db.transaction(["Consulta"], "readwrite");
      let store = transacao.objectStore("Consulta");
      let array = [];
      store.openCursor().onsuccess = event => {
        var cursor = event.target.result;
        if (cursor) {
          array.push(cursor.value);
          cursor.continue();
        } else {
          resolve(array);
        }
      };
    } catch (e) {
      resolve([]);
    }
  });
  return resultado;
};

//-----------------------------------------------------------------------------------------//

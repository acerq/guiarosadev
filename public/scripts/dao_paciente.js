"use strict";

var fnTirarEspera = new Function("tirarEspera()");
var fnColocarEspera = new Function("colocarEspera()");

export default class DAOPaciente {
  //-----------------------------------------------------------------------------------------//
  constructor() {
    //
    // Atributos
    //
    this.arrayPacientes = [];
    this.db = null;
  }

  //-----------------------------------------------------------------------------------------//

  async abrirDB() {
    this.db = await new Promise(function(resolve, reject) {
      // Necessário tratar com Promise pois pode
      var requestDB = window.indexedDB.open("Paciente", 1); // necessitar do evento onupgradeneeded e onsuccess
      requestDB.onupgradeneeded = event => {
        console.log("[DAOPaciente.construtor] Criando IndexedDB Paciente");
        let db = event.target.result;
        let store = db.createObjectStore("Paciente", {
          autoIncrement: true
        });
        store.createIndex("cpf", "cpf", { unique: true });
      };

      requestDB.onerror = event => {
        alert("Erro [DAOPaciente.construtor]: " + event.target.errorCode);
        reject(Error("Error: " + event.target.errorCode));
      };

      requestDB.onsuccess = event => {
        console.log("[DAOPaciente.construtor] Sucesso");
        if (event.target.result) resolve(event.target.result);
        else reject(Error("object not found"));
      };
    });
  }
  //-----------------------------------------------------------------------------------------//

  async obterPacientes() {
    let db = this.db;
    fnColocarEspera();
    this.arrayPacientes = await new Promise(function(resolve, reject) {
      let transacao;
      let store;
      try {
        transacao = db.transaction(["Paciente"], "readonly");
        store = transacao.objectStore("Paciente");
      } catch (e) {
        console.log("[DAOPaciente.obterPacientes] Erro");
        fnTirarEspera();
        resolve([]);
      }
      let array = [];
      store.openCursor().onsuccess = event => {
        fnTirarEspera();
        var cursor = event.target.result;
        if (cursor) {
          array.push(cursor.value);
          cursor.continue();
        } else {
          resolve(array);
        }
      };
    });
    return this.arrayPacientes;
  }

  //-----------------------------------------------------------------------------------------//

  validarDados(
    cpfNovo,
    nomeNovo,
    celularNovo,
    emailNovo,
    ruaNovo,
    numeroNovo,
    complementoNovo,
    bairroNovo,
    cepNovo,
    cidadeNovo,
    ufNovo
  ) {
    if (cpfNovo == null || cpfNovo == "") {
      alert("O CPF deve ser preenchido.");
      return false;
    }
    if (!this.validarCpf(cpfNovo)) {
      alert("O Cpf informado é inválido");
      return false;
    }

    if (nomeNovo == null || nomeNovo == "") {
      alert("O nome deve ser preenchido.");
      return false;
    }

    if (celularNovo == null || celularNovo == "") {
      alert("O celular deve ser preenchido.");
      return false;
    }

    if (emailNovo == null || emailNovo == "") {
      alert("O email deve ser preenchido.");
      return false;
    }

    const padraoEmail = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9-]+.[a-zA-Z]{2,4}/;
    if (!padraoEmail.test(emailNovo)) {
      alert("O email é inválido.");
      return false;
    }

    if (cepNovo == null || cepNovo == "") {
      alert("O CEP deve ser preenchido.");
      return false;
    }

    if (numeroNovo == null || numeroNovo == "") {
      alert("O número do endereço deve ser preenchido.");
      return false;
    }

    const padraoNum = /[0-9]/;
    if (!padraoNum.test(numeroNovo)) {
      alert("O número do endereço é inválido.");
      return false;
    }

    if(complementoNovo == null) {
      complementoNovo = "";
    }

    if (ruaNovo == null || ruaNovo == "") {
      alert("A rua do endereço deve ser preenchida.");
      return false;
    }

    if (bairroNovo == null || bairroNovo == "") {
      alert("O bairro deve ser preenchido.");
      return false;
    }

    if (cidadeNovo == null || cidadeNovo == "") {
      alert("A cidade deve ser preenchida.");
      return false;
    }

    if (ufNovo == null || ufNovo == "") {
      alert("A UF deve ser preenchida.");
      return false;
    }

    return true;
  }

  //-----------------------------------------------------------------------------------------//

  async incluir(
    cpfNovo,
    nomeNovo,
    celularNovo,
    emailNovo,
    ruaNovo,
    numeroNovo,
    complementoNovo,
    bairroNovo,
    cepNovo,
    cidadeNovo,
    ufNovo
  ) {
    if (
      !this.validarDados(
        cpfNovo,
        nomeNovo,
        celularNovo,
        emailNovo,
        ruaNovo,
        numeroNovo,
        complementoNovo,
        bairroNovo,
        cepNovo,
        cidadeNovo,
        ufNovo
      )
    )
      return false;

    fnColocarEspera();

    let db = this.db;
    let resultado = await new Promise(function(resolve, reject) {
      let transacao = db.transaction(["Paciente"], "readwrite");
      transacao.oncomplete = event => {
        console.log("[DAOPaciente.incluir] Sucesso");
        resolve("Ok");
      };
      let store = transacao.objectStore("Paciente");
      store.add({
        cpf: cpfNovo,
        nome: nomeNovo,
        celular: celularNovo,
        email: emailNovo,
        rua: ruaNovo,
        numero: numeroNovo,
        complemento: complementoNovo,
        bairro: bairroNovo,
        cep: cepNovo,
        cidade: cidadeNovo,
        uf: ufNovo
      });
    });
      
    if(complementoNovo == null || complementoNovo == "")
      complementoNovo = "null";

    // md5('@@MedicoNoApp@@') --> 5759494f25129de6d0bd71f41a582a8c
    let retorno = fetch(
      "/incluirPaciente/" +
        cpfNovo.replace(/\.|-/g, "") +
        "/" +
        nomeNovo +
        "/" +
        "5759494f25129de6d0bd71f41a582a8c" +
        "/" +
        emailNovo +
        "/" +
        celularNovo.replace(/\(|\)|\s|-/g, "") +
        "/" +
        ruaNovo +
        "/" +
        numeroNovo +
        "/" +
        complementoNovo +
        "/" +
        bairroNovo +
        "/" +
        cepNovo, { credentials : "include" }
    )
      .then(response => {
        console.log("(app.js) incluirPaciente response");
        fnTirarEspera();
        return true;
      })
      .catch(() => {
        console.log("(app.js) incluirPaciente catch");
        fnTirarEspera();
        return false;
      });

    return true;
  }

  //-----------------------------------------------------------------------------------------//

  async alterar(
    cpfAntigo,
    cpfNovo,
    nomeNovo,
    celularNovo,
    emailNovo,
    ruaNovo,
    numeroNovo,
    complementoNovo,
    bairroNovo,
    cepNovo,
    cidadeNovo,
    ufNovo
  ) {
    if (
      !this.validarDados(
        cpfNovo,
        nomeNovo,
        celularNovo,
        emailNovo,
        ruaNovo,
        numeroNovo,
        complementoNovo,
        bairroNovo,
        cepNovo,
        cidadeNovo,
        ufNovo
      )
    )
      return false;

    fnColocarEspera();

    let db = this.db;
    let resultado = await new Promise(function(resolve, reject) {
      let transacao = db.transaction(["Paciente"], "readwrite");
      transacao.oncomplete = event => {
        console.log("[DAOPaciente.alterar] Sucesso");
        fnTirarEspera();
        resolve("Ok");
      };
      transacao.onerror = event => {
        console.log("[DAOPaciente.excluir] Erro: ", event.target.error);
        fnTirarEspera();
        reject(Error("[DAOPaciente.alterar] Erro"));
      };
      let store = transacao.objectStore("Paciente");
      store.openCursor().onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.cpf == cpfAntigo) {
            const updateData = cursor.value;
            updateData.cpf = cpfNovo;
            updateData.nome = nomeNovo;
            updateData.celular = celularNovo;
            updateData.email = emailNovo;
            updateData.rua = ruaNovo;
            updateData.numero = numeroNovo;
            updateData.complemento = complementoNovo;
            updateData.bairro = bairroNovo;
            updateData.cep = cepNovo;
            updateData.cidade = cidadeNovo;
            updateData.uf = ufNovo;
            const request = cursor.update(updateData);
            request.onsuccess = () => {
              console.log("[DAOPaciente.alterar] Cursor update - Sucesso ");
              resolve("Ok");
            };
          }
          cursor.continue();
        }
      };
    });
      
    if(complementoNovo == null || complementoNovo == "")
      complementoNovo = "null";
    // md5('@@MedicoNoApp@@') --> 5759494f25129de6d0bd71f41a582a8c
    let retorno = fetch(
      "/incluirPaciente/" +
        cpfNovo.replace(/\.|-/g, "") +
        "/" +
        nomeNovo +
        "/" +
        "5759494f25129de6d0bd71f41a582a8c" +
        "/" +
        emailNovo +
        "/" +
        celularNovo.replace(/\(|\)|\s|-/g, "") +
        "/" +
        ruaNovo +
        "/" +
        numeroNovo +
        "/" +
        complementoNovo +
        "/" +
        bairroNovo +
        "/" +
        cepNovo, { credentials : "include" }
    )
      .then(response => {
        console.log("(app.js) incluirPaciente response");
        fnTirarEspera();
        return true;
      })
      .catch(() => {
        console.log("(app.js) incluirPaciente catch");
        fnTirarEspera();
        return false;
      });

    return true;
  }
  //-----------------------------------------------------------------------------------------//

  async excluir(cpfExclusao) {
    fnColocarEspera();

    let db = this.db;
    let transacao = await new Promise(function(resolve, reject) {
      transacao = db.transaction(["Paciente"], "readwrite");
      transacao.oncomplete = event => {
        console.log("[DAOPaciente.alterar] Sucesso");
        resolve(transacao);
      };
      transacao.onerror = event => {
        console.log("[DAOPaciente.excluir] Erro: ", event.target.error);
        fnTirarEspera();
        reject(Error("[DAOPaciente.alterar] Erro"));
      };
    });

    let resultado = await new Promise(function(resolve, reject) {
      let store = transacao.objectStore("Paciente");
      store.openCursor().onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.cpf == cpfExclusao) {
            const request = cursor.delete();
            request.onsuccess = () => {
              console.log("[DAOPaciente.excluir] Cursor delete - Sucesso ");
              fnTirarEspera();
              resolve("Ok");
              return;
            };
          }
          cursor.continue();
        }
        reject("Não Encontrou");
      };
    });
  }

  //-----------------------------------------------------------------------------------------//

  validarCpf(strCpf) {
    let soma;
    let resto;
    let i;

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
}

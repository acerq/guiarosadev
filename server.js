"use strict";

const express = require("express");
const fetch = require("node-fetch");
const redirectToHTTPS = require("express-http-to-https").redirectToHTTPS;

const BASE_URL =
  "http://sisp.e-sisp.org:8049/webrunstudio_73/webservices/GSIServices.jws?wsdl";
const TEMPO_MAXIMO_SESSAO = 20 * 60 * 1000; // 20 minutos
const TEMPO_MAXIMO_REQUISICAO = 60 * 1000; // 60 segundos

//-----------------------------------------------------------------------------------------//

const guiaRosaApp = {
  tempoCorrente: null,
  login: null,
  senha: null,
  nome: null,
  celular: null,
  email: null,
  rua: null,
  numero: null,
  complemento: null,
  bairro: null,
  cep: null,
  ehMedico: null
};

//-----------------------------------------------------------------------------------------//

function acertaData(data) {
  return (
    data.substring(8, 10) +
    "/" +
    data.substring(5, 7) +
    "/" +
    data.substring(0, 4)
  );
}

//-----------------------------------------------------------------------------------------//

function doObterUsuarioCorrente(req, resp) {
  guiaRosaApp.tempoCorrente = new Date();
  console.log("retornarUsuario --> ", JSON.stringify(guiaRosaApp));
  resp.json(guiaRosaApp);
  resp.end();
  return;
}

//-----------------------------------------------------------------------------------------//

function doVerificarTimeout(req, resp) {
  let diferenca = new Date() - guiaRosaApp.tempoCorrente;

  console.log("Tempo: " + diferenca);
  if (diferenca > TEMPO_MAXIMO_SESSAO) {
    resp.json(JSON.parse('{"erro" : "Sessão Expirada"}'));
    resp.end();
    console.log("Sessão expirada!");
    return;
  }
  guiaRosaApp.tempoCorrente = new Date();
  resp.json(JSON.parse('{"ok" : "' + diferenca + '"}'));
  resp.end();
  console.log("Sessão ok!");
}

//-----------------------------------------------------------------------------------------//

function doGuardarUsuarioCorrente(req, resp) {
  console.log("doGuardarUsuarioCorrente");

  guiaRosaApp.tempoCorrente = new Date();
  let cpf = req.params.cpf;
  let senha = req.params.senha;
  let nome = req.params.nome;
  let email = req.params.email;
  let celular = req.params.celular;
  let rua = req.params.rua;
  let numero = req.params.numero;
  let complemento = req.params.complemento;
  let bairro = req.params.bairro;
  let cep = req.params.cep;

  guiaRosaApp.tempoCorrente = new Date();
  guiaRosaApp.login = cpf;
  guiaRosaApp.senha = senha;
  guiaRosaApp.nome = nome;
  guiaRosaApp.email = email;
  guiaRosaApp.celular = celular;
  guiaRosaApp.rua = rua;
  guiaRosaApp.numero = numero;
  guiaRosaApp.complemento = complemento;
  guiaRosaApp.bairro = bairro;
  guiaRosaApp.cep = cep;
  guiaRosaApp.ehMedico = false;

  console.log("doGuardarUsuarioCorrente --> ", JSON.stringify(guiaRosaApp));
  resp.json(guiaRosaApp);
  resp.end();
  return;
}

//-----------------------------------------------------------------------------------------//

function doLoginMedico(req, resp) {
  // Retirando '.' e '-' do login --> caso onde recebemos cpf.
  let login = req.params.login.replace(/\.|-/g, "");
  let senha = req.params.senha;

  if (typeof login === "undefined" || login === null) {
    resp.json(JSON.parse('{"erro" : "[Erro:#0001] Usuário Inválido"}'));
    return;
  }

  if (typeof senha === "undefined" || senha === null) {
    resp.json(JSON.parse('{"erro" : "[Erro:#0002] Senha Inválida"}'));
    return;
  }

  // Montando a string JSON para a requisição
  let strJson = '{"login": "' + login + '", "senha": "' + senha + '"}';
  console.log("doLoginMedico " + strJson);

  // Recupera o objeto soap da biblioteca node.js
  let soap = require("soap");
  // Cria um cliente para o WebService
  soap.createClient(
    BASE_URL,
    { wsdl_options: { timeout: TEMPO_MAXIMO_REQUISICAO } },
    function(err, client) {
      console.log("createClient: " + client + " - " + err);

      if (client == null || typeof client === "undefined") {
        console.log("doLogin Err -> " + JSON.stringify(err));
        if (err.hasOwnProperty("code") && err.code == "ETIMEDOUT") {
          resp.json(
            JSON.parse(
              '{"erro" : "[Erro:#0003] Falha na Conexão com o Servidor: TIMEOUT"}'
            )
          );
        } else {
          resp.json(
            JSON.parse(
              '{"erro" : "[Erro:#0003] Falha na Conexão com o Servidor"}'
            )
          );
        }
        resp.end();

        return;
      }

      // Faz a solicitação ao WebService 'Wslogin'
      client.Wslogin({ TXTjson: strJson }, function(err, wsResposta) {
        console.log("doLogin webservice");
        if (err) {
          console.log("doLogin Err -> ", err.response.body);
          resp.json(
            JSON.parse(
              '{"erro" : "[Erro:#0004] Falha na Conexão com o Servidor"}'
            )
          );
          return;
        }
        let resposta = JSON.parse(wsResposta.WsloginReturn.$value);
        if (resposta.status == "error") {
          doLoginPaciente(req, resp);
          return;
        }
        console.log("doLogin Resposta ->", wsResposta);
        guiaRosaApp.tempoCorrente = new Date();
        guiaRosaApp.login = login;
        guiaRosaApp.senha = senha;
        guiaRosaApp.nome = resposta.nome;
        guiaRosaApp.email = "";
        guiaRosaApp.celular = "";
        guiaRosaApp.rua = "";
        guiaRosaApp.numero = "";
        guiaRosaApp.complemento = "";
        guiaRosaApp.bairro = "";
        guiaRosaApp.cep = "";
        guiaRosaApp.ehMedico = true;
        console.log("doLogin Resposta ->", resposta);
        resp.json(resposta);
      });
    }
  );
}

//-----------------------------------------------------------------------------------------//

function doLoginPaciente(req, resp) {
  let login = req.params.login;
  let senha = req.params.senha;
  let strJson = '{"login": "' + login + '", "senha": "' + senha + '"}';

  console.log("doLoginPaciente " + strJson);

  let soap = require("soap");
  soap.createClient(BASE_URL, function(err, client) {
    console.log("createClient: " + client + " - " + err);

    client.Wsvalidapaciente({ TXTjson: strJson }, function(err, wsResposta) {
      console.log("doLoginPaciente webservice");
      if (err) {
        console.log("doLoginPaciente Err -> ", err.response.body);
        resp.json(
          JSON.parse(
            '{"erro" : "[Erro:#0005] Falha na Conexão com o Servidor"}'
          )
        );
        return;
      }
      let resposta = JSON.parse(wsResposta.WsvalidapacienteReturn.$value);
      if (resposta.status == "error") {
        resp.json(JSON.parse('{"erro" : "[Erro:#0006] Login Inválido"}'));
        return;
      }
      console.log("doLoginPaciente Resposta ->", wsResposta);
      guiaRosaApp.tempoCorrente = new Date();
      guiaRosaApp.login = login;
      guiaRosaApp.senha = senha;
      guiaRosaApp.nome = resposta.nome;
      guiaRosaApp.email = "";
      guiaRosaApp.celular = "";
      guiaRosaApp.rua = "";
      guiaRosaApp.numero = "";
      guiaRosaApp.complemento = "";
      guiaRosaApp.bairro = "";
      guiaRosaApp.cep = "";
      guiaRosaApp.ehMedico = false;
      console.log("doLoginPaciente Resposta ->", resposta);
      resp.json(resposta);
    });
  });
}

//-----------------------------------------------------------------------------------------//

function doObterLocais(req, resp) {
  let soap = require("soap");
  console.log("executando doObterLocais ");

  soap.createClient(BASE_URL, function(err, client) {
    console.log("createClient");
    client.Wsretornalocais(null, function(err, result1) {
      console.log("WSretornalocais webservice");
      if (err) {
        console.log("WSretornalocais Err -> ", err.response.body);
        resp.json(JSON.parse('{"erro" : null}'));
        return;
      }
      let resposta = JSON.parse(result1.WsretornalocaisReturn.$value);
      let arrayLocais = resposta.locais;
      console.log("doObterLocais Resposta ->", JSON.stringify(arrayLocais));
      resp.json(arrayLocais);
    });
  });
}

//-----------------------------------------------------------------------------------------//

function doObterPeriodo(req, resp) {
  guiaRosaApp.tempoCorrente = new Date();

  let soap = require("soap");
  console.log("executando doObterPeriodo ");

  soap.createClient(BASE_URL, function(err, client) {
    console.log("createClient");
    client.Wsretornaperiodo(null, function(err, result1) {
      console.log("WSretornaperiodo webservice");
      if (err) {
        console.log("WSretornaperiodo Err -> ", err.response.body);
        resp.json(JSON.parse('{"erro" : null}'));
        return;
      }
      let resposta = JSON.parse(result1.WsretornaperiodoReturn.$value);
      console.log("doObterPeriodo Resposta ->", JSON.stringify(resposta));
      resp.json(resposta);
    });
  });
}

//-----------------------------------------------------------------------------------------//

function doIncluirPaciente(req, resp) {
  guiaRosaApp.tempoCorrente = new Date();

  let soap = require("soap");

  let cpf = req.params.cpf.replace(/\.|-/g, "");
  let nome = req.params.nome;
  let senhaMD5 = req.params.senhaMD5;
  let email = req.params.email;
  let celular = req.params.celular;
  let endereco =
    req.params.rua +
    " " +
    req.params.numero +
    " " +
    req.params.complemento +
    "-" +
    req.params.bairro +
    "," +
    req.params.cep;

  let strJson =
    '{"nome": "' +
    nome +
    '","cpf":"' +
    cpf +
    '","senha":"' +
    senhaMD5 +
    '","email":"' +
    email +
    '","celular":"' +
    celular +
    '","endereco":"' +
    endereco +
    '"}';

  console.log("executando doIncluirPaciente ", strJson);

  soap.createClient(BASE_URL, function(err, client) {
    console.log("createClient");
    client.Wsincluipaciente({ TXTjson: strJson }, function(err, result1) {
      console.log("Wsincluipaciente webservice");
      if (err) {
        let erro = err.response.body;
        console.log("Wsincluipaciente Err -> ", erro);
        let posInicial = erro.indexOf("<faultstring>") + "<faultstring>".length;
        let posFinal = erro.indexOf("</faultstring>");
        let msg = erro.substring(posInicial, posFinal);
        resp.json(
          JSON.parse(
            '{"erro" : "[Erro:#0007] Erro na conexão com o servidor - ' +
              msg +
              '"}'
          )
        );
        return;
      }
      console.log(result1.WsincluipacienteReturn.$value);
      let resposta = JSON.parse(result1.WsincluipacienteReturn.$value);
      console.log("doIncluirPaciente Resposta ->", resposta);
      resp.json(resposta);
      resp.end();
    });
  });
}

//-----------------------------------------------------------------------------------------//

function doObterExames(req, resp) {
  guiaRosaApp.tempoCorrente = new Date();

  let soap = require("soap");

  let local = req.params.local;
  let exame = req.params.exame;

  let strJson = '{"local": "' + local + '","string_exame":"' + exame + '"}';

  console.log("executando doObterExames ", local, " ", exame);

  soap.createClient(BASE_URL, function(err, client) {
    console.log("createClient");
    client.Wsretornaexames({ TXTjson: strJson }, function(err, result1) {
      console.log("Wsretornaexames webservice");
      if (err) {
        console.log("Wsretornaexames Err -> ", err.response.body);
        resp.json(JSON.parse('{"erro" : null}'));
        return;
      }
      let resposta = JSON.parse(result1.WsretornaexamesReturn.$value);
      let arrayExames = resposta.exames;
      console.log("doObterExames Resposta ->", JSON.stringify(arrayExames));
      resp.json(JSON.stringify(arrayExames));
    });
  });
}

//-----------------------------------------------------------------------------------------//

function doSolicitacao(req, resp) {
  guiaRosaApp.tempoCorrente = new Date();

  let soap = require("soap");

  let executante = req.params.executante;
  let solicitante = req.params.solicitante;
  let paciente = req.params.paciente;
  let cpf = req.params.cpf;
  let exame = req.params.exame;
  let dataExame = req.params.data;
  let periodo = req.params.periodo;
  let faturar = req.params.faturar;

  console.log("Solicitação - " + guiaRosaApp.login);
  if (guiaRosaApp.ehMedico) {
    solicitante = guiaRosaApp.login;
  } else {
    solicitante = "0000"; //TODO
  }
  console.log("executando doSolicitacao");
  if (
    typeof executante === "undefined" ||
    typeof solicitante === "undefined" ||
    typeof paciente === "undefined" ||
    typeof exame === "undefined" ||
    typeof periodo === "undefined" ||
    typeof dataExame === "undefined" ||
    typeof faturar === "undefined"
  ) {
    console.log("undefined 0006");
    resp.json(JSON.parse('{"erro" : "[Erro:#0008] Solicitação Inválida"}'));
    return;
  }

  let dados =
    '[{"CD_EXECUTANTE":' +
    executante +
    "," +
    '"CD_SOLICITANTE":' +
    solicitante +
    "," +
    '"NM_PACIENTE":"' +
    paciente +
    '",' +
    '"CPF":"' +
    cpf +
    '",' +
    '"CD_EXAME":"' +
    exame +
    '",' +
    '"DT_EXAME":"' +
    acertaData(dataExame) +
    '",' +
    '"DT_PERIODO":"' +
    acertaData(periodo) +
    '",' +
    '"FAT_SN":"' +
    faturar +
    '"}]';

  console.log(dados);

  soap.createClient(BASE_URL, function(err, client) {
    console.log("createClient");
    client.Importacaoguiarosaimportarincluirregistromobws(
      { Dados: dados },
      function(err, result) {
        console.log("doSolicitacao webservice");
        if (err) {
          console.log("dodoSolicitacao Err -> ", err.response.body);
          resp.json(
            JSON.parse('{"erro" : "[Erro:#0009] Solicitação Inválida"}')
          );
          return;
        }
        console.log(result);
        let resposta =
          result.ImportacaoguiarosaimportarincluirregistromobwsReturn.multiRef
            .$value;
        console.log("doSolicitacao Resposta 1->" + resposta);
        resp.json(JSON.parse('{"mensagem":"Ok"}'));
      }
    );
  });
}

//-----------------------------------------------------------------------------------------//

async function doPgtoCC(req, resp) {
  guiaRosaApp.tempoCorrente = new Date();

  let nome = req.params.nome;
  let cpf = req.params.cpf;
  let email = req.params.email;
  let numeroCartao = req.params.numeroCartao;
  let nomeCartao = req.params.nomeCartao;
  let bandeira = req.params.bandeira;
  let mesValidade = req.params.mesValidade;
  let anoValidade = req.params.anoValidade;
  let cvv = req.params.cvv;
  let valor = req.params.valor;
  
  console.log("executando doPgtoCC" + nome );
  if (
    typeof nome === "undefined" ||
    typeof cpf === "undefined" ||
    typeof email === "undefined" ||
    typeof numeroCartao === "undefined" ||
    typeof nomeCartao === "undefined" ||
    typeof bandeira === "undefined" ||
    typeof mesValidade === "undefined" ||
    typeof anoValidade === "undefined" ||
    typeof cvv === "undefined" ||
    typeof valor === "undefined"
  ) {
    console.log("undefined 0012");
    resp.json(JSON.parse('{"erro" : "[Erro:#0012] Solicitação Inválida"}'));
    return;
  }

  console.log("parâmetros ok doPgtoCC");

  let agora = new Date();
  let timeMillis = agora.getTime().toString();
  let id = guiaRosaApp.login + "_" + timeMillis;
  
  const myHeaders = {
      "Content-Type": "application/json",
      "MerchantId"  : "6ad5e5f0-0c0b-4ccf-a5d2-edc0c8ab9b2c",
      "MerchantKey" : "MCWSCKUOGYWXBGOWLUMXGKVHKTECEQSMQYCUWTAB"
    };
  
  const myBody =    {
    "MerchantOrderId": id,
    "Customer":{
      "Name"         : nome,
      "Identity"     : cpf,
      "IdentityType" : "CPF",
      "Email"        : email,
    },
    "Payment":{
      "Provider"       : "Simulado",
      "Type"           : "CreditCard",
      "Amount"         : valor,
      "Currency"       : "BRL",
      "Country"        : "BRA",
      "SoftDescriptor" : "GuiaRosa",
      "Capture"        : true,
      "Installments"   : 1,
      "CreditCard":{
         "CardNumber"     : numeroCartao,
         "Holder"         : nomeCartao,
         "ExpirationDate" : mesValidade + "/" + anoValidade,
         "SecurityCode"   : cvv,
         "Brand"          : bandeira
      }
    }
  };
      
  const requisicao = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(myBody)
  };
  
  console.log("doPgtoCC --> " + JSON.stringify(requisicao));
  const responseBraspag = await fetch("https://apisandbox.braspag.com.br/v2/sales/", requisicao);
  console.log("fetch doPgtoCC");
  const myJson = await responseBraspag.json();
  console.log("json doPgtoCC");
  console.log(myJson);

  resp.json(myJson);
}

//-----------------------------------------------------------------------------------------//

function doVerificarSenhaUsuarioCorrente(req, resp) {
  guiaRosaApp.tempoCorrente = new Date();
  let senha = req.params.senha;

  console.log("verificarSenhaUsuarioCorrente - " + guiaRosaApp.login);
  console.log(
    "verificarSenhaUsuarioCorrente - " + guiaRosaApp.senha + " - " + senha
  );
  if (typeof senha === "undefined") {
    console.log("undefined 0010");
    resp.json(JSON.parse('{"erro" : "[Erro:#0010] Senha Não Informada."}'));
    return;
  }

  if (guiaRosaApp.senha != senha) {
    console.log("verificarSenhaUsuarioCorrente - erro na senha");
    resp.json(JSON.parse('{"erro" : "[Erro:#0011] Senha Não Confere."}'));
  } else {
    console.log("verificarSenhaUsuarioCorrente -ok");
    resp.json(JSON.parse('{"mensagem":"Ok"}'));
  }
}

//-----------------------------------------------------------------------------------------//

function startServer() {
  const app = express();

  // Redirect HTTP to HTTPS,
  app.use(redirectToHTTPS([/localhost:(\d{4})/], [], 301));

  // Efetuando o log para cada requisição
  app.use((req, resp, next) => {
    const now = new Date();
    const time = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
    const path = `"${req.method} ${req.path}"`;
    const m = `${req.ip} - ${time} - ${path}`;
    console.log(m);
    next();
  });

  //
  // Chamadas aos Serviços Remotos
  //

  // Login
  app.get("/login/:login/:senha", doLoginMedico);
  app.get("/login/:login", doLoginMedico);
  app.get("/login", doLoginMedico);

  // Guardar Usuário Corrente
  app.get(
    "/guardarUsuarioCorrente/:cpf/:senha/:nome/:email/:celular/:rua/:numero/:complemento/:bairro/:cep",
    doGuardarUsuarioCorrente
  );

  // Verificar Senha do Usuário Corrente
  app.get("/verificarSenha/", doVerificarSenhaUsuarioCorrente);
  app.get("/verificarSenha/:senha", doVerificarSenhaUsuarioCorrente);

  // Obter Usuário Corrente
  app.get("/inicio", doObterUsuarioCorrente);
  app.get("/obterUsuarioCorrente", doObterUsuarioCorrente);

  // Incluir Paciente
  app.get(
    "/incluirPaciente/:cpf/:nome/:senhaMD5/:email/:celular/:rua/:numero/:complemento/:bairro/:cep",
    doIncluirPaciente
  );

  // Envio de Solicitação de Exame
  app.get(
    "/solicitacao/:executante/:solicitante/:paciente/:cpf/:exame/:data/:periodo/:faturar",
    doSolicitacao
  );

  // Pagamento por cartão
  app.get("/pgtocc/:cpf/:nome/:email/:numeroCartao/:nomeCartao/:bandeira/:mesValidade/:anoValidade/:cvv/:valor", doPgtoCC);

  // Obter Locais
  app.get("/obterLocais/", doObterLocais);

  // Obter Período
  app.get("/obterPeriodo/", doObterPeriodo);

  // Obter Exames
  app.get("/obterExames/:local/:exame", doObterExames);

  // Verificar Tempo de Conexão
  app.get("/verificarTimeout/", doVerificarTimeout);

  //
  //
  //

  // Indicando ao express que os arquivos estáticos estão na pasta 'public'
  app.use(express.static("public"));

  // Iniciando o servidor local
  return app.listen("8000", () => {
    console.log("Servidor Local iniciado na porta 8000");
  });
}

startServer();

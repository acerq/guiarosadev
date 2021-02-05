"use strict";

const express = require("express");
const fetch = require("node-fetch");
const redirectToHTTPS = require("express-http-to-https").redirectToHTTPS;
const cookieParser = require('cookie-parser');
 
const BASE_URL = "http://sisp.e-sisp.org:8049/webrunstudio_73/webservices/GSIServices.jws?wsdl";
const SESSION_ID = "session_id"; 
const TEMPO_MAXIMO_SESSAO = 20 * 60 * 1000; // 20 minutos
const TEMPO_COOKIE_APOS_SESSAO_FINALIZADA = 20 * 60 * 1000; // 20 minutos
const TEMPO_MAXIMO_REQUISICAO = 60 * 1000; // 60 segundos

//-----------------------------------------------------------------------------------------//

var usuariosAtivos;
var horaUltimaVerificacao;
var dtPeriodo;
var locais;

//-----------------------------------------------------------------------------------------//

function setPeriodo() {
  let soap = require("soap");
  console.log("executando obterPeriodo ");

  soap.createClient(BASE_URL, function(err, client) {
    console.log("createClient");
    client.Wsretornaperiodo(null, function(err, result1) {
      console.log("WSretornaperiodo webservice");
      if (err) {
        console.log("ERRO setLocais: " + JSON.stringify(err));
        console.log("WSretornaperiodo Err -> ", err.response.body);
        dtPeriodo = null;
        return;
      }
      let resposta = JSON.parse(result1.WsretornaperiodoReturn.$value);
     
      var dia = resposta.Periodo.substring(0, 2);
      var mes = resposta.Periodo.substring(3, 5);
      var ano = resposta.Periodo.substring(6, 10);
      dtPeriodo = ano + "-" + mes + "-" + dia;
      console.log("setPeriodo Resposta -> " + dtPeriodo);
      horaUltimaVerificacao = new Date().getTime();
    });
  });
}

//-----------------------------------------------------------------------------------------//

function setLocais() {
  let soap = require("soap");

  soap.createClient(BASE_URL, function(err, client) {
    console.log("createClient");
    client.Wsretornalocais(null, function(err, result1) {
      console.log("WSretornalocais webservice");
      if (err) {
        console.log("ERRO setLocais: " + JSON.stringify(err));
        locais = null;
        return;
      }
      let resposta = JSON.parse(result1.WsretornalocaisReturn.$value);
      console.log("doObterLocais Resposta ->", JSON.stringify(resposta.locais));
      locais = resposta.locais;
      horaUltimaVerificacao = new Date().getTime();
    });
  });
}

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

function removerSessoesFinalizadas() {
  let chaves = usuariosAtivos.keys();
  let horaAtual = new Date().getTime();
  
  while(true) {
    let ch = chaves.next().value;
    if(ch == null)
      break;
    let sessao = usuariosAtivos.get(ch);
    if(sessao.tempoCorrente + TEMPO_MAXIMO_SESSAO < horaAtual)  {
      usuariosAtivos.delete(ch);    
      console.log('removeu ' + ch);
    }
  }
  
  if(horaAtual > horaUltimaVerificacao + TEMPO_MAXIMO_SESSAO) {
    setPeriodo();
    setLocais();
  }
}

//-----------------------------------------------------------------------------------------//

function recuperarSessao(req, resp) {
  
  new Promise((res,rej) => { removerSessoesFinalizadas(); });
  
  let session_id = parseInt(req.cookies[SESSION_ID]);
  console.log("session_id --> ", session_id, " ", typeof session_id, " ",usuariosAtivos);

  if(session_id == null || session_id == undefined) {
    resp.json(JSON.parse('{"erro" : "Sessão não aberta"}'));
    resp.end();
    return null;
  }
  
  for (let k of usuariosAtivos.keys()) {
    console.log("#-->", k, ":", typeof k, ":", session_id, ":", typeof session_id, ":", k === session_id);
    console.log("#-->", usuariosAtivos.get(k));
    console.log("#-->", usuariosAtivos.get(session_id));
  }
  
  let sessao = usuariosAtivos.get(session_id);
  console.log("#### sessao --> ", sessao);
  if(sessao == null || sessao == undefined) {
    resp.json(JSON.parse('{"erro" : "Sessão não iniciada ou expirada"}'));
    resp.end();
    return null;    
  }
  
  let diferenca = new Date().getTime() - sessao.tempoCorrente;
  if (diferenca > TEMPO_MAXIMO_SESSAO) {
    usuariosAtivos.delete(session_id);
    resp.cookie(SESSION_ID, sessao.session_id, { maxAge: 0, httpOnly: true });
    resp.json(JSON.parse('{"erro" : "Sessão Expirada"}'));
    resp.end();
    return;
  }
  sessao.tempoCorrente = new Date();
  resp.cookie(SESSION_ID, sessao.session_id, { maxAge: TEMPO_MAXIMO_SESSAO + TEMPO_COOKIE_APOS_SESSAO_FINALIZADA, httpOnly: true });
  return sessao;
}
  
//-----------------------------------------------------------------------------------------//

function SessaoGuiaRosa(login, senha, nome, ehMedico) {
  this.tempoCorrente = new Date();
  this.session_id = this.tempoCorrente.getTime().valueOf();
  this.login = login;
  this.senha = senha;
  this.nome = nome;
  this.celular = "";
  this.email = "";
  this.rua = "";
  this.numero = "";
  this.complemento = "";
  this.bairro = "";
  this.cep = "";
  this.ehMedico = ehMedico;
  
  this.pgto = null;
  this.agendamento = null;
}

//-----------------------------------------------------------------------------------------//

SessaoGuiaRosa.prototype.setCadastro = function(celular, email, rua, numero, complemento, bairro, cep) {
  if(complemento == "null")
    complemento = "";
  
  this.celular = celular;
  this.email = email;
  this.rua = rua;
  this.numero = numero;
  this.complemento = complemento;
  this.bairro = bairro;
  this.cep = cep;
}

//-----------------------------------------------------------------------------------------//
  
function PgtoCredito(id, nome, cpf, email, numeroCartao, nomeCartao, bandeira, mesValidade, anoValidade, cvv, valor) {
  this.id = id;
  this.nome = nome;
  this.cpf = cpf;
  this.email = email;
  this.numeroCartao = numeroCartao;
  this.nomeCartao = this.nomeCartao;
  this.bandeira = bandeira;
  this.mesValidade = mesValidade;
  this.anoValidade = anoValidade;
  this.cvv = cvv;
  this.valor = valor;
  
  this.merchantOrderId = null;
  this.status = null;
  this.proofOfSale = null;
  this.paymentId = null;
}

//-----------------------------------------------------------------------------------------//

PgtoCredito.prototype.setDadosPgto = function(merchantOrderId, status, proofOfSale, paymentId) {
  this.status = status;
  this.merchantOrderId = merchantOrderId;
  this.proofOfSale = proofOfSale;
  this.paymentId = paymentId;
}

//-----------------------------------------------------------------------------------------//

function Agendamento(executante, solicitante, paciente, cpf, codExame, nomeExame, nomeExecutante, enderecoExecutante, faturar) {
  this.executante = executante;
  this.solicitante = solicitante;
  this.paciente = paciente;
  this.cpf = cpf;
  this.codExame = codExame;
  this.nomeExame = nomeExame;
  this.nomeExecutante = nomeExecutante;
  this.enderecoExecutante = enderecoExecutante;
  this.faturar = faturar;
}

//-----------------------------------------------------------------------------------------//

function doInicio(req, resp) {
  console.log("+---------- ");
  console.log("| doInicio");
  console.log("+---------- ");

  let sessao = new SessaoGuiaRosa(null, null, null, false);
  
  resp.json(sessao);
  resp.end();
  
  console.log("doInicio ");
  console.log("doInicio --> ", JSON.stringify(sessao));
  console.log("doInicio  ");
  return;
}

//-----------------------------------------------------------------------------------------//

function doObterUsuarioCorrente(req, resp) {
  console.log("+------------------------- ");
  console.log("| doObterUsuarioCorrente");
  console.log("+------------------------- ");
  
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  console.log("@retornarUsuario --> ", JSON.stringify(sessao));
  resp.json(sessao);
  resp.end();
  return;
}

//-----------------------------------------------------------------------------------------//

function doVerificarTimeout(req, resp) {
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  resp.json(JSON.parse('{"ok" : "ok"}'));
  resp.end();
  console.log("Sessão ok!");
}

//-----------------------------------------------------------------------------------------//

function doGuardarUsuarioCorrente(req, resp) {
  console.log("+------------------------- ");
  console.log("| doGuardarUsuarioCorrente ");
  console.log("+------------------------- ");

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

  let sessao = new SessaoGuiaRosa(cpf, senha, nome, false);
  sessao.setCadastro(celular, email, rua, numero, complemento, bairro, cep);
    
  usuariosAtivos.set(sessao.session_id, sessao);

  console.log("doGuardarUsuarioCorrente --> session_id: ", sessao.session_id);
  console.log("doGuardarUsuarioCorrente --> ", JSON.stringify(sessao));
  console.log("doGuardarUsuarioCorrente --> session_id: ", sessao.session_id);

  resp.json(sessao);
  resp.end();
  return;
}

//-----------------------------------------------------------------------------------------//

function doLoginMedico(req, resp) {
  console.log("+------------------------- ");
  console.log("| doLoginMedico ");
  console.log("+------------------------- ");

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
      console.log("doLoginMedico soap: " + client + " - " + err);

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
          console.log("doLoginMedico error ->" + wsResposta.WsloginReturn.$value);
          doLoginPaciente(req, resp);
          return;
        }
        console.log("doLogin Resposta ->", wsResposta.WsloginReturn.$value);
        
        let sessao = new SessaoGuiaRosa(login, senha, resposta.nome, true);

        usuariosAtivos.set(sessao.session_id, sessao);
        resp.cookie(SESSION_ID, sessao.session_id, { maxAge: TEMPO_MAXIMO_SESSAO + TEMPO_COOKIE_APOS_SESSAO_FINALIZADA, httpOnly: true });

        console.log("doLoginMedico ------------ ");
        console.log("doLoginMedico session_id: ", sessao.session_id);
        console.log("doLoginMedico get  ", usuariosAtivos.get(sessao.session_id));
        console.log("doLoginMedico ------------ ");
        console.log("doLoginMedico ------------ ");
        console.log("doLoginMedico ------------ ");
        
        resp.json(sessao);
      });
    }
  );
}

//-----------------------------------------------------------------------------------------//

function doLoginPaciente(req, resp) {
  console.log("+------------------------- ");
  console.log("| doLoginPaciente ");
  console.log("+------------------------- ");

  let login = req.params.login.replace(/\.|-/g, "");
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
        console.log("-----> " + wsResposta.WsvalidapacienteReturn.$value);
        resp.json(JSON.parse('{"erro" : "[Erro:#0006] Login Inválido"}'));
        return;
      }
      console.log("doLoginPaciente Resposta ->", wsResposta);
      
      let sessao = new SessaoGuiaRosa(login, senha, resposta.nome, false);

      usuariosAtivos.set(sessao.session_id, sessao);
      resp.cookie(SESSION_ID, sessao.session_id, { maxAge: TEMPO_MAXIMO_SESSAO + TEMPO_COOKIE_APOS_SESSAO_FINALIZADA, httpOnly: true });

      console.log("doLoginPaciente session_id: ", sessao.session_id);
      console.log("doLoginPaciente Resposta ->", resposta);
      console.log("doLoginPaciente session_id: ", sessao.session_id);

      resp.json(sessao);
    });
  });
}

//-----------------------------------------------------------------------------------------//

function doObterLocais(req, resp) {
  console.log("executando doObterLocais");
  resp.json(locais);
}

//-----------------------------------------------------------------------------------------//

function doObterPeriodo(req, resp) {
  console.log("executando doObterPeriodo ");
  resp.json(dtPeriodo);
}

//-----------------------------------------------------------------------------------------//

function doIncluirUsuarioPaciente(req, resp) {
  console.log("+------------------------- ");
  console.log("| doIncluirUsuarioPaciente ");
  console.log("+------------------------- ");

  let soap = require("soap");

  let cpf = req.params.cpf.replace(/\.|-/g, "");
  let nome = req.params.nome;
  let senhaMD5 = req.params.senhaMD5;
  let email = req.params.email;
  let celular = req.params.celular;
  let rua = req.params.rua;
  let numero = req.params.numero;
  let complemento = req.params.complemento;
  if(complemento == "null")
    complemento = "";
  let bairro = req.params.bairro;
  let cep = req.params.cep;
  let endereco = rua + " " + numero + " " + complemento + "-" + bairro + "," + cep;

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

  console.log("executando doIncluirUsuarioPaciente ", strJson);

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
      console.log("doIncluirUsuarioPaciente Resposta ->", resposta);
      
      let sessao = new SessaoGuiaRosa(cpf, senhaMD5, nome, false);
      sessao.setCadastro(celular, email, rua, numero, complemento, bairro, cep); 
      
      usuariosAtivos.set(sessao.session_id, sessao);
      resp.cookie(SESSION_ID, sessao.session_id, { maxAge: TEMPO_MAXIMO_SESSAO + TEMPO_COOKIE_APOS_SESSAO_FINALIZADA, httpOnly: true });

      console.log("doIncluirUsuarioPaciente session_id: ", sessao.session_id);
      console.log("doIncluirUsuarioPaciente Resposta ->", resposta);
      console.log("doIncluirUsuarioPaciente session_id: ", sessao.session_id);
      
      resp.json(sessao);
      resp.end();
    });
  });
}

//-----------------------------------------------------------------------------------------//

function doIncluirPaciente(req, resp) {
  console.log("+------------------------- ");
  console.log("| doIncluirPaciente ");
  console.log("+------------------------- ");

  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  
  let soap = require("soap");

  let cpf = req.params.cpf.replace(/\.|-/g, "");
  let nome = req.params.nome;
  let senhaMD5 = req.params.senhaMD5;
  let email = req.params.email;
  let celular = req.params.celular;
  let rua = req.params.rua;
  let numero = req.params.numero;
  let complemento = req.params.complemento;
  if(complemento == "null")
    complemento = "";
  let bairro = req.params.bairro;
  let cep = req.params.cep;
  let endereco = rua + " " + numero + " " + complemento + "-" + bairro + "," + cep;

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
      
      console.log("doLoginPaciente session_id: ", sessao.session_id);
      console.log("doLoginPaciente Resposta ->", resposta);
      console.log("doLoginPaciente session_id: ", sessao.session_id);

      resp.json(resposta);
      resp.end();
    });
  });
}

//-----------------------------------------------------------------------------------------//

function doObterExames(req, resp) {
  console.log("+------------------------- ");
  console.log("| doObterExames ");
  console.log("+------------------------- ");

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

function doAgendamento(req, resp) {
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  
  let soap = require("soap");
  
  let executante = req.params.executante;
  let solicitante = req.params.solicitante;
  let paciente = req.params.paciente;
  let cpf = req.params.cpf;
  let codExame = req.params.codExame;
  let nomeExame = req.params.nomeExame;
  let nomeExecutante = req.params.nomeExecutante;
  let enderecoExecutante = req.params.enderecoExecutante;
  let faturar = req.params.faturar;

  console.log("Agendamento - " + sessao.login);
  if (sessao.ehMedico) {
    solicitante = sessao.login;
  } else {
    solicitante = "0000"; //TODO
  }
  console.log("executando doAgendamento");
  if (
    typeof executante === "undefined" ||
    typeof solicitante === "undefined" ||
    typeof paciente === "undefined" ||
    typeof codExame === "undefined" ||
    typeof nomeExame === "undefined" ||
    typeof nomeExecutante === "undefined" ||
    typeof enderecoExecutante === "undefined" ||
    typeof faturar === "undefined"
  ) {
    console.log("undefined 0006");
    resp.json(JSON.parse('{"erro" : "[Erro:#0008] Solicitação Inválida"}'));
    return;
  }

  let agendamento = new Agendamento(executante, solicitante, paciente, cpf, codExame, nomeExame, 
                                    nomeExecutante, enderecoExecutante, faturar);
  sessao.agendamento = agendamento;
  
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
    codExame +
    '",' +
    '"DT_PERIODO":"' +
    dtPeriodo.replace(/-/g, "/") +
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
        console.log("doAgendamento webservice");
        if (err) {
          console.log("dados Agendamento Err -> ", err.response.body);
          resp.json(
            JSON.parse('{"erro" : "[Erro:#0009] Solicitação Inválida"}')
          );
          return;
        }
        console.log(result);
        let resposta =
          result.ImportacaoguiarosaimportarincluirregistromobwsReturn.multiRef
            .$value;
        console.log("doAgendamento Resposta 1->" + resposta);
        resp.json(JSON.parse('{"mensagem":"Ok"}'));
      }
    );
  });
}

//-----------------------------------------------------------------------------------------//

async function doPgtoCC(req, resp) {
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  
  let nome = req.params.nome;
  let cpf = req.params.cpf;
  let email = req.params.email;
  let id = req.params.id;
  let numeroCartao = req.params.numeroCartao;
  let nomeCartao = req.params.nomeCartao;
  let bandeira = req.params.bandeira;
  let mesValidade = req.params.mesValidade;
  let anoValidade = req.params.anoValidade;
  let cvv = req.params.cvv;
  let valor = req.params.valor;

  console.log("executando doPgtoCC" + nome);
  if (
    typeof nome === "undefined" ||
    typeof cpf === "undefined" ||
    typeof email === "undefined" ||
    typeof id === "undefined" ||
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
  
  let pgtoCC = new PgtoCredito(id, nome, cpf, email, numeroCartao, nomeCartao, bandeira, mesValidade, anoValidade, cvv, valor);

  const myHeaders = {
    "Content-Type": "application/json",
    "MerchantId": "0c476fc2-f8f5-4e85-a60c-366463f210e2",
    "MerchantKey": "HHNUGBUVGJFMKHGMLWEWJIOEYFAXAKAJAWQCKAFB"
  };

  const myBody = {
    MerchantOrderId: id,
    Customer: {
      Name: nome,
      Identity: cpf,
      IdentityType: "CPF",
      Email: email
    },
    Payment: {
      Provider: "Simulado",
      Type: "CreditCard",
      Amount: valor,
      Currency: "BRL",
      Country: "BRA",
      SoftDescriptor: "GuiaRosa",
      Capture: true,
      Installments: 1,
      CreditCard: {
        CardNumber: numeroCartao,
        Holder: nomeCartao,
        ExpirationDate: mesValidade + "/" + anoValidade,
        SecurityCode: cvv,
        Brand: bandeira
      }
    }
  };

  const requisicao = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(myBody)
  };

  console.log("doPgtoCC --> " + JSON.stringify(requisicao));
  const responseBraspag = await fetch(
    "https://apisandbox.braspag.com.br/v2/sales/",
    requisicao
  );
  console.log("fetch doPgtoCC");
  const respostaPgto = await responseBraspag.json();
  console.log("json doPgtoCC");
  console.log(respostaPgto);
  
  sessao.pgto = pgtoCC;
  if (respostaPgto.Payment && respostaPgto.Payment.ReasonCode == 0) 
    pgtoCC.setDadosPgto(respostaPgto.MerchantOrderId, respostaPgto.Payment.Status, respostaPgto.Payment.ProofOfSale, respostaPgto.Payment.PaymentId);
  
  resp.json(respostaPgto);
}

//-----------------------------------------------------------------------------------------//

async function doPgtoDebito(req, resp) {
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  
  let nome = req.params.nome;
  let cpf = req.params.cpf;
  let email = req.params.email;
  let id = req.params.id;
  let numeroCartao = req.params.numeroCartao;
  let nomeCartao = req.params.nomeCartao;
  let bandeira = req.params.bandeira;
  let mesValidade = req.params.mesValidade;
  let anoValidade = req.params.anoValidade;
  let valor = req.params.valor;

  console.log("executando doPgtoDebito " + nome);
  if (
    typeof nome === "undefined" ||
    typeof cpf === "undefined" ||
    typeof email === "undefined" ||
    typeof id === "undefined" ||
    typeof numeroCartao === "undefined" ||
    typeof nomeCartao === "undefined" ||
    typeof bandeira === "undefined" ||
    typeof mesValidade === "undefined" ||
    typeof anoValidade === "undefined" ||
    typeof valor === "undefined"
  ) {
    console.log("undefined 0012");
    resp.json(JSON.parse('{"erro" : "[Erro:#0012] Solicitação Inválida"}'));
    return;
  }

  console.log("parâmetros ok doPgtoDebito ");
    
  let pgtoCC = new PgtoCredito(id, nome, cpf, email, numeroCartao, nomeCartao, bandeira, mesValidade, anoValidade, null, valor);

  const myHeaders = {
    "Content-Type": "application/json",
    "MerchantId": "0c476fc2-f8f5-4e85-a60c-366463f210e2",
    "MerchantKey": "HHNUGBUVGJFMKHGMLWEWJIOEYFAXAKAJAWQCKAFB"
  };

  const myBody = {
    MerchantOrderId: id,
    Customer: {
      Name: nome,
      Identity: cpf,
      IdentityType: "CPF",
      Email: email,
      Birthdate: "1970-06-24"
    },
    Payment: {
      Provider: "Simulado",
      Type: "DebitCard",
      Amount: valor,
      Currency: "BRL",
      Country: "BRA",
      Installments: 1,
      Interest: "ByMerchant",
      Capture: true,
      Authenticate: true,
      Recurrent: false,
      SoftDescriptor: "GuiaRosa",
      ReturnUrl: "https://guia-rosa.glitch.me/finalizarDebito",
      DebitCard: {
        CardNumber: numeroCartao,
        Holder: nomeCartao,
        ExpirationDate: mesValidade + "/" + anoValidade,
        // SecurityCode: cvv,
        Brand: bandeira
      },
      "Credentials": {
        "code": "9999999",
        "key": "D8888888",
        "password": "LOJA9999999",
        "username": "#Braspag2018@NOMEDALOJA#",
        "signature": "001"
      }
    }
  };

  const requisicao = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(myBody)
  };

  console.log("doPgtoDebito --> " + JSON.stringify(requisicao));
  const responseBraspag = await fetch(
    "https://apisandbox.braspag.com.br/v2/sales/",
    requisicao
  );
  console.log("fetch doPgtoDebito");
  
  const respostaPgto = await responseBraspag.json();
  console.log("json doPgtoDebito");
  console.log(respostaPgto);
  
  sessao.pgto = pgtoCC;
  if (respostaPgto.Payment) 
    pgtoCC.setDadosPgto(respostaPgto.MerchantOrderId, respostaPgto.Payment.Status, respostaPgto.Payment.ProofOfSale, respostaPgto.Payment.PaymentId);
  
  console.log("json doPgtoDebito sessão");
  console.log(sessao);
  resp.json(respostaPgto);
}

//-----------------------------------------------------------------------------------------//

async function doFinalizarPgtoDebito(req, resp) {
  resp.redirect('solicitacao.html');
}

//-----------------------------------------------------------------------------------------//

async function doPgtoBoleto(req, resp) {
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  
  let id = req.params.id;
  let nome = req.params.nome;
  let cpf = req.params.cpf;
  let email = req.params.email;
  let valor = req.params.valor;
  let exame = req.params.exame;
  let dataPgto = req.params.dataPgto;

  console.log("executando doPgtoBoleto" + nome);
  if (
    typeof nome === "undefined" ||
    typeof cpf === "undefined" ||
    typeof email === "undefined" ||
    typeof id === "undefined" ||
    typeof valor === "undefined" ||
    typeof exame === "undefined" ||
    typeof dataPgto === "undefined" 
  ) {
    console.log("undefined 0012");
    resp.json(JSON.parse('{"erro" : "[Erro:#0012] Solicitação Inválida"}'));
    return;
  }

  console.log("parâmetros ok doPgtoBoleto");

  let pgtoCC = new PgtoCredito(id, nome, cpf, email, null, null, null, null, null, null, valor);

  let agora = new Date();
  let timeMillis = agora.getTime().toString();

  const myHeaders = {
    "Content-Type": "application/json",
    "MerchantId": "0c476fc2-f8f5-4e85-a60c-366463f210e2",
    "MerchantKey": "HHNUGBUVGJFMKHGMLWEWJIOEYFAXAKAJAWQCKAFB"
  };

  const myBody = {
    MerchantOrderId: id,
    Customer: {
      Name: nome,
      Identity: cpf,
      IdentityType: "CPF",
      Email: email,
      Birthdate: "1970-06-24"
    },
    Payment: {
      Provider: "Simulado",
      Type: "Boleto",
      Amount: valor,
      BoletoNumber: id.replace("_",""),
      Assignor: "Interclínicas ...", //TODO 
      Demonstrative: "Pagamento referente ao Exame " + exame,
      ExpirationDate: dataPgto,
      Identification: cpf,
      Instructions: "Aceitar somente até a data de vencimento.",
      Currency: "BRL",
      Country: "BRA",
      SoftDescriptor: "GuiaRosa"
    }
  };

  const requisicao = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(myBody)
  };

  console.log("doPgtoBoleto --> " + JSON.stringify(requisicao));
  const responseBraspag = await fetch(
    "https://apisandbox.braspag.com.br/v2/sales/",
    requisicao
  );
  console.log("fetch doPgtoBoleto");
  const respostaPgto = await responseBraspag.json();
  console.log("json doPgtoBoleto");
  console.log(respostaPgto);
  
  sessao.pgto = pgtoCC;
  if (respostaPgto.Payment && respostaPgto.Payment.ReasonCode == 0) 
    pgtoCC.setDadosPgto(respostaPgto.MerchantOrderId, respostaPgto.Payment.Status, respostaPgto.Payment.ProofOfSale, respostaPgto.Payment.PaymentId);
  
  resp.json(respostaPgto);
}

//-----------------------------------------------------------------------------------------//

async function doVerificarPgto(req, resp) {
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  
  if(sessao.pgto == null) 
    return null;

  let paymentId = sessao.pgto.paymentId;
  console.log("executando doVerificarPgto " + paymentId);

  const myHeaders = {
    "MerchantId": "0c476fc2-f8f5-4e85-a60c-366463f210e2",
    "MerchantKey": "HHNUGBUVGJFMKHGMLWEWJIOEYFAXAKAJAWQCKAFB"
  };

  const requisicao = {
    method: "GET",
    headers: myHeaders
  };

  console.log("doVerificarPgto --> " + JSON.stringify(requisicao));
  const responseBraspag = await fetch(
    "https://apiquerysandbox.braspag.com.br/v2/sales/" + paymentId,
    requisicao
  );
  console.log("fetch doVerificarPgto");
  const resposta = await responseBraspag.json();
  console.log("json doVerificarPgto");
  console.log(resposta);
  console.log("json doVerificarPgto pgto");
  console.log(sessao.pgto);

  sessao.pgto.status = resposta.Payment.Status;

  resp.json(sessao);
}

//-----------------------------------------------------------------------------------------//

function doVerificarSenhaUsuarioCorrente(req, resp) {
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  let senha = req.params.senha;

  console.log("verificarSenhaUsuarioCorrente - " + sessao.login);
  console.log(
    "verificarSenhaUsuarioCorrente - " + sessao.senha + " - " + senha
  );
  if (typeof senha === "undefined") {
    console.log("undefined 0010");
    resp.json(JSON.parse('{"erro" : "[Erro:#0010] Senha Não Informada."}'));
    return;
  }

  if (sessao.senha != senha) {
    console.log("verificarSenhaUsuarioCorrente - erro na senha");
    resp.json(JSON.parse('{"erro" : "[Erro:#0011] Senha Não Confere."}'));
  } else {
    console.log("verificarSenhaUsuarioCorrente -ok");
    resp.json(JSON.parse('{"mensagem":"Ok"}'));
  }
}

//-----------------------------------------------------------------------------------------//

async function doGerarConfirmacao(req, resp) {
  let sessao = recuperarSessao(req, resp);
  if(sessao == null) 
    return;
  
  let nome = req.params.nome;
  let cpf = req.params.cpf;
  let numeroCartao = req.params.numeroCartao;
  let nomeCartao = req.params.nomeCartao;
  let bandeira = req.params.bandeira;
  let nomeExame = req.params.nomeExame;
  let nomeExecutante = req.params.nomeExecutante;
  let endereco = req.params.endereco;
  let valor = req.params.valor;
  let forma = req.params.forma;
  let merchantOrderId = req.params.merchantOrderId;
  let proofOfSale = req.params.proofOfSale;
  let paymentId = req.params.paymentId;
  let url = req.params.url;

  console.log("executando doGerarConfirmação" + nome);
  if (
    typeof nome === "undefined" ||
    typeof cpf === "undefined" ||
    typeof numeroCartao === "undefined" ||
    typeof nomeCartao === "undefined" ||
    typeof bandeira === "undefined" ||
    typeof nomeExame === "undefined" ||
    typeof nomeExecutante === "undefined" ||
    typeof endereco === "undefined" ||
    typeof valor === "undefined" ||
    typeof forma === "undefined" ||
    typeof merchantOrderId === "undefined" ||
    typeof proofOfSale === "undefined" ||
    typeof paymentId === "undefined" ||
    typeof url === "undefined" 
  ) {
    console.log("undefined 0012");
    resp.json(JSON.parse('{"erro" : "[Erro:#0012] Solicitação Inválida"}'));
    return;
  }

  console.log("parâmetros ok doGerarConfirmacao");

  // npm install pdfkit
  let PDFDocument = require("pdfkit");
  let fs = require("fs");
  let pdf = new PDFDocument({ bufferPages: true });
  let buffers = [];
  pdf.on("data", buffers.push.bind(buffers));
  pdf.on("end", () => {
    let pdfData = Buffer.concat(buffers);
    resp.setHeader("Content-type", "application/pdf");
    resp.setHeader("Content-Length", Buffer.byteLength(pdfData));
    resp.setHeader(
      "Content-disposition",
      "attachment;filename=confirmacao_" + merchantOrderId + ".pdf"
    );
    resp.send(pdfData);
    resp.end();
  });

  pdf.image(
    "public/images/interclinicas.png",
    150,
    50,
    { fit: [300, 100] }
  );
  pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
     .fontSize(25)
     .text("Voucher para Execução de Exame", 135, 120);

  pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
     .fontSize(14)
     .text("ID Guia Rosa: #" , 80, 180, {continued: true})
     .font("public/fonts/SourceSansPro-Regular.ttf")
     .text(merchantOrderId + "\n");

  pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
     .text("ID Guia Rosa: #" , 80, 200, {continued: true})
     .text("Exame Agendado:\n");

  pdf.font("public/fonts/SourceSansPro-Regular.ttf")
     .text("       " + nomeExame + "\n")
     .text("       " + nomeExecutante + "\n")
     .text("       " + endereco + "\n");

  pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
     .text("Valor: ", {continued: true})
     .font("public/fonts/SourceSansPro-Regular.ttf")
     .text("R$ " + valor + "\n");
  
  pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
     .text("Agendado para: ", {continued: true})
     .font("public/fonts/SourceSansPro-Regular.ttf")
     .text(nome + " (" + cpf + ")\n\n");
  
  if(forma == "Cartão de Crédito") {
    numeroCartao =
      numeroCartao.substring(0, 4) +
      " " +
      numeroCartao.substring(4, 6) +
      "XX XXXX XX" +
      numeroCartao.substring(14);

    pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
       .text("Pagamento efetuado com cartão de crédito: ", {continued: true})
       .font("public/fonts/SourceSansPro-Regular.ttf")
       .text(numeroCartao + " (" + bandeira + ")\n");
  
    pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
       .text("Número da Autorização: ", {continued: true})
       .font("public/fonts/SourceSansPro-Regular.ttf")
       .text( proofOfSale + "\n");
  
  }
  pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
     .text("Identificação do Pagamento: ", {continued: true})
     .font("public/fonts/SourceSansPro-Regular.ttf")
     .text( paymentId + "\n");
  
  if(url != "null") {
    url = url.replace(/%2F/g, "/");
    pdf.font("public/fonts/SourceSansPro-SemiBold.ttf")
       .text("Endereço para download do boleto: \n")
       .font("public/fonts/SourceSansPro-Regular.ttf")
       .fontSize(11)
       .text(url, { link: url, underline: true });
  }
  pdf.end();
  
  sessao.agendamento = null;
  sessao.pgto = null;
}

//-----------------------------------------------------------------------------------------//

async function doObterEnderecoPeloCep(req, resp) {
  let cep = req.params.cep;
  let response =  await fetch('http://cep.republicavirtual.com.br/web_cep.php?cep=' + cep + '&formato=jsonp');
  let myJson = await response.json();
  console.log("doObterCep " + JSON.stringify(myJson));
  resp.json(myJson);
}

//-----------------------------------------------------------------------------------------//

function startServer() {
  const app = express();
  app.use(cookieParser());

  // Redirect HTTP to HTTPS,
  app.use(redirectToHTTPS([/localhost:(\d{4})/], [], 301));

  // Efetuando o log para cada requisição
  app.use((req, resp, next) => {
    const now = new Date();
    const time = now.toLocaleDateString() + ' - ' + now.toLocaleTimeString();
    const path = req.method + ' ' + req.path;
    const m = req.ip + ' - ' + time + ' - ' + path +  ' - ' +JSON.stringify(req.cookies);
    console.log(m);
    next();
  });

  console.log("+----------------- ");
  console.log("| START SERVER ");
  console.log("+----------------- ");

  usuariosAtivos = new Map();

  //
  // Chamadas aos Serviços Remotos
  //

  // Iniciar
  app.get("/inicio", doInicio);

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
  app.get("/obterUsuarioCorrente", doObterUsuarioCorrente);

  // Incluir Usuario Paciente
  app.get(
    "/incluirUsuarioPaciente/:cpf/:nome/:senhaMD5/:email/:celular/:rua/:numero/:complemento/:bairro/:cep",
    doIncluirUsuarioPaciente
  );

  // Incluir Paciente
  app.get(
    "/incluirPaciente/:cpf/:nome/:senhaMD5/:email/:celular/:rua/:numero/:complemento/:bairro/:cep",
    doIncluirPaciente
  );

  // Envio de Solicitação de Agendamento de Exame
  app.get(
    "/agendamento/:executante/:solicitante/:paciente/:cpf/:codExame/:nomeExame/:nomeExecutante/:enderecoExecutante/:faturar",
    doAgendamento
  );
  
  // Pagamento por cartão de crédito
  app.get(
    "/pgtocc/:cpf/:nome/:email/:id/:numeroCartao/:nomeCartao/:bandeira/:mesValidade/:anoValidade/:cvv/:valor",
    doPgtoCC
  );

  // Pagamento por cartão de debito
  app.get(
    "/pgtodebito/:cpf/:nome/:email/:id/:numeroCartao/:nomeCartao/:bandeira/:mesValidade/:anoValidade/:valor",
    doPgtoDebito
  );
  app.post("/finalizarDebito", doFinalizarPgtoDebito );


  // Pagamento por boleto
  app.get(
    "/pgtoboleto/:cpf/:nome/:email/:id/:valor/:exame/:dataPgto",
    doPgtoBoleto
  );
  
  // Verificar status de pagamento
  app.get(
    "/verificarPgto",
    doVerificarPgto
  );
  
  // Gerar PDF de resposta
  app.get(
    "/gerarConfirmacao/:cpf/:nome/:numeroCartao/:nomeCartao/:bandeira/:nomeExame/:nomeExecutante/:endereco" +
      "/:valor/:forma/:merchantOrderId/:proofOfSale/:paymentId/:url",
    doGerarConfirmacao
  );

  // obter dados pelo CEP
  app.get(
    "/obterEnderecoPeloCep/:cep", 
    doObterEnderecoPeloCep);

  // Obter Locais
  app.get("/obterLocais/", doObterLocais);

  // Obter Período
  app.get("/obterPeriodo/", doObterPeriodo);

  // Obter Exames
  app.get("/obterExames/:local/:exame", doObterExames);

  // Verificar Tempo de Conexão
  app.get("/verificarTimeout/", doVerificarTimeout);

  // Inicializando dataPeriodo e Locais
  setPeriodo();
  setLocais();
  
  // Indicando ao express que os arquivos estáticos estão na pasta 'public'
  app.use(express.static("public"));

  // Iniciando o servidor local
  return app.listen("8000", () => {
    console.log("Servidor Local iniciado na porta 8000");
  });
}

startServer();

const divConteudo = document.getElementById("divConteudo");
var usrApp = null;

// -----------------------------------------------------------------------------------------//

$("#hdr").load("burger.html");

// -----------------------------------------------------------------------------------------//

setTimeout(function() {
  $("div.burger").on("click", function() {
    if (!$(this).hasClass("open")) {
      openMenu();
    } else {
      closeMenu();
    }
  });
}, 1000);

// -----------------------------------------------------------------------------------------//

if ("ontouchstart" in window) {
  //  var click = "click";
}

$("div.burger").on("click", function() {
  if (!$(this).hasClass("open")) {
    openMenu();
  } else {
    closeMenu();
  }
});

$("div.menu ul li a").on("click", function(e) {
  e.preventDefault();
  closeMenu();
});

// -----------------------------------------------------------------------------------------//

function irPara(ref) {
  if (!ref.includes(".pdf")) window.location.href = ref;
  else window.open(ref);
}

// -----------------------------------------------------------------------------------------//

function openMenu() {
  $("div.circle").addClass("expand");

  $("div.burger").addClass("open");
  $("div.x, div.y, div.z").addClass("collapse");
  $(".menu li").addClass("animate");

  setTimeout(function() {
    $("div.y").hide();
    $("div.x").addClass("rotate30");
    $("div.z").addClass("rotate150");
  }, 70);
  setTimeout(function() {
    $("div.x").addClass("rotate45");
    $("div.z").addClass("rotate135");
  }, 120);
  var conteudo = document.getElementById("divConteudo");
  conteudo.hidden = true;
}

// -----------------------------------------------------------------------------------------//

function closeMenu() {
  $("div.burger").removeClass("open");
  $("div.x")
    .removeClass("rotate45")
    .addClass("rotate30");
  $("div.z")
    .removeClass("rotate135")
    .addClass("rotate150");
  $("div.circle").removeClass("expand");
  $(".menu li").removeClass("animate");

  setTimeout(function() {
    $("div.x").removeClass("rotate30");
    $("div.z").removeClass("rotate150");
  }, 50);
  setTimeout(function() {
    $("div.y").show();
    $("div.x, div.y, div.z").removeClass("collapse");
  }, 70);
  const conteudo = document.getElementById("divConteudo");
  conteudo.hidden = false;
}

// -----------------------------------------------------------------------------------------//

async function doObterUsuarioCorrente() {
  let response = await fetch("/obterUsuarioCorrente", { credentials : "include" });
  usrApp = await response.json();
  renderObterUsuarioCorrente(); 
  return usrApp;
}

// -----------------------------------------------------------------------------------------//

function renderObterUsuarioCorrente() {
  if (usrApp.login != null) {
    if (usrApp.ehMedico) {
      $("#menu").load("menu_medico.html");
      $("#container-de-icones").load("icones_medico.html");
      if(document.URL.includes("inicio.html"))
        divConteudo.innerHTML = "<center><b>Atendimento a Médicos</center></b><br/>";
    } else {
      $("#menu").load("menu_paciente.html");
      $("#container-de-icones").load("icones_paciente.html");
      if(document.URL.includes("inicio.html"))
        divConteudo.innerHTML = "";
    }
    if(document.URL.includes("inicio.html"))
      divConteudo.innerHTML += "<center><b>Bem-vindo(a)</b> " + usrApp.nome +
                             "&nbsp;&nbsp;(" + usrApp.login + ")</center>";
  } else {
    if(!exigirLogin()) {
      $("#menu").load("menu_sem_usuario.html");
      $("#container-de-icones").load("icones_paciente.html");
    } else {
      loginApp();
    }
  }
  closeMenu();
}

// -----------------------------------------------------------------------------------------//

function cadastroDePacientes() {
  return fetch("/verificarTimeout", { credentials : "include" })
    .then(async response => {
      let msg = await response.json();
      if (msg.hasOwnProperty("erro")) {
        alert(msg.erro);
        irPara("index.html");
        return;
      }
      irPara("bdpaciente.html");
      return response.json();
    })
    .catch(e => {
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

function solicitacaoDeExames() {
  return fetch("/verificarTimeout", { credentials : "include" })
    .then(async response => {
      let msg = await response.json();
      if (msg.hasOwnProperty("erro")) {
        alert(msg.erro);
        irPara("index.html");
        return;
      }
      irPara("solicitacao.html");
      return response.json();
    })
    .catch(e => {
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

function apresentarListas() {
  return fetch("/verificarTimeout", { credentials : "include" })
    .then(async response => {
      let msg = await response.json();
      if (msg.hasOwnProperty("erro")) {
        alert(msg.erro);
        irPara("index.html");
        return;
      }
      irPara("listas.html");
      return response.json();
    })
    .catch(e => {
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

function paginaInicial() {
  return fetch("/verificarTimeout", { credentials : "include" })
    .then(async response => {
      let msg = await response.json();
      if (msg.hasOwnProperty("erro")) {
        alert(msg.erro);
        irPara("index.html");
        return;
      }
      irPara("inicio.html");
      return response.json();
    })
    .catch(e => {
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

window.retornarUsrApp = async function() {
  if(usrApp == null) {
      await doObterUsuarioCorrente();
      renderObterUsuarioCorrente();
  }
  return usrApp;
};

// -----------------------------------------------------------------------------------------//

function loginApp() {
  window.location.href='login.html';
}

// -----------------------------------------------------------------------------------------//

async function obterUsrApp() {
  await doObterUsuarioCorrente();
  renderObterUsuarioCorrente();
  return usrApp;
}

// -----------------------------------------------------------------------------------------//

async function abrirApp() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").then(reg => {
      });
    });
  }
}

// -----------------------------------------------------------------------------------------//

async function fecharApp() {
  let response = await fetch("/inicio", { credentials : "include" });
  usrApp = await response.json();
  closeMenu();
  try {
    navigator.app.exitApp();
  } catch (e) {
    var tamHistory = window.history.length;
    if(tamHistory == 0)
        window.location.href='index.html';
    else
      while (tamHistory > 0) {
        window.history.go(-1);
        tamHistory--;
      }
  }
}

// -----------------------------------------------------------------------------------------//

function colocarEspera() {
  $("div.circle").addClass("wait");
}

// -----------------------------------------------------------------------------------------//

function tirarEspera() {
  $("div.circle").removeClass("wait");
}

// -----------------------------------------------------------------------------------------//

function exigirLogin() {
  let url = document.URL;
  if(url.charAt(url.length - 1) == '/' || url.includes("cadusuario.html") || url.includes("login.html") || url.includes("consulta.html"))
    return false;
  return true;
}

// -----------------------------------------------------------------------------------------//

obterUsrApp();
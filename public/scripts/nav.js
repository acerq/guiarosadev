const divConteudo = document.getElementById("divConteudo");
var usrApp = null;
var inicio = false;

$("#hdr").load("burger.html");

// -----------------------------------------------------------------------------------------//

doObterUsuarioCorrente().then(retorno => {
  console.log("abrirApp retorno", retorno);
  renderObterUsuarioCorrente(retorno);
});

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
  if(!ref.includes(".pdf"))
    window.location.href = ref;
  else
    window.open(ref);
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
  console.log("(app.js) Executando doLoad ");
  let response = await fetch("/obterUsuarioCorrente");
  return await response.json();
}

// -----------------------------------------------------------------------------------------//

function renderObterUsuarioCorrente(retorno) {
  usrApp = retorno;
  if (usrApp.ehMedico) {
	  $("#menu").load("menu_medico.html");
    $("#container-de-icones").load("icones_medico.html");
  }
  else {
	  $("#menu").load("menu_paciente.html");
    $("#container-de-icones").load("icones_paciente.html");
  }
  
  if (inicio) {
    console.log(usrApp);
    divConteudo.innerHTML = "";
    if (usrApp.ehMedico)
      divConteudo.innerHTML +=
        "<center><b>Atendimento a Médicos</center></b><br/>";
    divConteudo.innerHTML +=
      "<center><b>Bem-vindo(a)</b> " +
      usrApp.nome +
      "&nbsp;&nbsp;(" +
      usrApp.login +
      ")</center>";
  }
  closeMenu();
}

// -----------------------------------------------------------------------------------------//

function cadastroDePacientes() {
  console.log("(nav.js) Verificando Timeout ");
  return fetch("/verificarTimeout")
    .then(async response => {
      console.log("(nav.js) VerificarTimeout response");
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
      console.log("(nav.js) do catch", e);
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

function solicitacaoDeExames() {
  console.log("(nav.js) Verificando Timeout ");
  return fetch("/verificarTimeout")
    .then(async response => {
      console.log("(nav.js) VerificarTimeout response");
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
      console.log("(nav.js) do catch", e);
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

function apresentarListas() {
  console.log("(nav.js) Verificando Timeout ");
  return fetch("/verificarTimeout")
    .then(async response => {
      console.log("(nav.js) VerificarTimeout response");
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
      console.log("(nav.js) do catch", e);
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

function paginaInicial() {
  console.log("(nav.js) Verificando Timeout ");
  return fetch("/verificarTimeout")
    .then(async response => {
      console.log("(nav.js) VerificarTimeout response");
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
      console.log("(nav.js) do catch", e);
      return null;
    });
}

// -----------------------------------------------------------------------------------------//

window.retornarUsrApp = function() {
  return usrApp;
};

// -----------------------------------------------------------------------------------------//

function abrirApp() {
  inicio = true;
}

// -----------------------------------------------------------------------------------------//

function fecharApp() {
  try {
    navigator.app.exitApp();
  }
  catch(e) {
	  var tamHistory = window.history.length;
    while(tamHistory > 0) {
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

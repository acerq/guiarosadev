"use strict";

//-----------------------------------------------------------------------------------------//

let deferredInstallPrompt = null;
window.addEventListener("appinstalled", logAppInstalled);
window.addEventListener("beforeinstallprompt", saveBeforeInstallPromptEvent);

//-----------------------------------------------------------------------------------------//

function saveBeforeInstallPromptEvent(evt) {
  deferredInstallPrompt = evt;
}
//-----------------------------------------------------------------------------------------//

function installGuiaRosa(evt) {
  deferredInstallPrompt.prompt();
  evt.srcElement.setAttribute("hidden", true);
  deferredInstallPrompt.userChoice.then(choice => {
    if (choice.outcome === "accepted") {
      console.log("Usr accepted ", choice);
    } else {
      console.log("Usr dismissed ", choice);
    }
    deferredInstallPrompt = null;
  });
}

//-----------------------------------------------------------------------------------------//

function logAppInstalled(evt) {
  console.log("Guia Rosa Instalado.", evt);
}

//-----------------------------------------------------------------------------------------//

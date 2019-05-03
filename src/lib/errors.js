import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn, getLogText } from "util/log";
import Vue from 'vue';
let electron = window.require("electron");

let domReady = false;

function displayError ({title, message})  {
  document.getElementById("error_title").innerText = title;
  document.getElementById("error_text").innerText = message;
  document.getElementById("error_logs").value = getLogText();

  document.getElementById("error_display").style.display= 'flex';
  document.getElementById("copy_logs").onclick = () => {
    electron.remote.clipboard.writeText(getLogText());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  domReady = true;
} );

export const showError = ({ title = "Unknown Error", message = ""}) => {
  warn("Error: "+ title + "\n" + message);

  if(domReady) {
    displayError({title, message})
  }
  else {
    document.addEventListener('DOMContentLoaded', () => {
      displayError({title, message});
    });
  }
};

export const startErrorMonitoring = () => {
  window.onerror = function(message, source, lineno, colno, error) {
    showError({message, title:"Unknown Error"});
  };

  Vue.config.errorHandler = err => {
    warn(err.stack.split("\n").slice(0,4).join("\n"));
    showError({message: err.message, title:"Error"});
  }

  window.addEventListener("unhandledrejection", function(promiseRejectionEvent) {
    warn("Unhandled rejection");
    let err = (promiseRejectionEvent.reason);
    warn(err.stack.split("\n").slice(0,4).join("\n"));
    showError({message:err.message, title:"UHR Error"});
  });

};

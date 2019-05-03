let log_text = "";

export const getLogText = () => {
  return log_text;
};

function addLogText (message, ctx = {}) {
  log_text += (message + "\n");
}

export const warn = (message, context = {}) => {
  addLogText(message, context);
  console.warn(message, context)
};
export const error = (message, context = {}) => {
  addLogText(message, context);
  console.log(message, context)
};
export const debug = (message, context = {}) => {
  addLogText(message, context);
  console.log(message, context)
};
export const info = (message, context = {}) => {
  addLogText(message, context);
  console.log(message, context)
};
export const priv = (message, context = {}) => {
  console.log(message, context)
};
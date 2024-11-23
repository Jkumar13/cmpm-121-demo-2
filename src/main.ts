import "./style.css";

const APP_NAME = "Game";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

// create element for the title
const appTitle = document.createElement("h1");
appTitle.textContent = "app title";

//create canvas element with 256x256 pixels size
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

// append both elements to the document body
document.body.appendChild(appTitle);
document.body.appendChild(canvas);
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


// create clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";

document.body.appendChild(clearButton);

// 2d drawing context of canvas
const ctx = canvas.getContext("2d");

// establishing variables
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// mouse events
function startDrawing(event: MouseEvent) {
    isDrawing = true;
    lastX = event.offsetX;
    lastY = event.offsetY;
}

function draw(event: MouseEvent) {
    if (!isDrawing) return;

    const currentX = event.offsetX;
    const currentY = event.offsetY;

    // draw lines
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastX = currentX;
    lastY = currentY;
}

function stopDrawing() {
    isDrawing = false;
}

// event listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

// clear buutton event listener
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
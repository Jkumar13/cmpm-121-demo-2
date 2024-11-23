import "./style.css";

const APP_NAME = "Game";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

// 1. Create the <h1> element for the title
const appTitle = document.createElement("h1");
appTitle.textContent = "app title";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";

document.body.appendChild(appTitle);
document.body.appendChild(canvas);
document.body.appendChild(clearButton);

const ctx = canvas.getContext("2d");

let lines: Array<Array<{ x: number, y: number }>> = [];
let currentLine: Array<{ x: number, y: number }> = [];

let isDrawing = false;
let lastX = 0;
let lastY = 0;

function startDrawing(event: MouseEvent) {
    isDrawing = true;
    lastX = event.offsetX;
    lastY = event.offsetY;
    currentLine = [{ x: lastX, y: lastY }];
}

function draw(event: MouseEvent) {
    if (!isDrawing) return;

    const currentX = event.offsetX;
    const currentY = event.offsetY;

    currentLine.push({ x: currentX, y: currentY });

    const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
    canvas.dispatchEvent(drawingChangedEvent);

    lastX = currentX;
    lastY = currentY;
}

function stopDrawing() {
    if (isDrawing) {
        lines.push(currentLine);
        currentLine = [];
    }
    isDrawing = false;
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

clearButton.addEventListener("click", () => {
    lines = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        line.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    });

    if (currentLine.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentLine[0].x, currentLine[0].y);
        currentLine.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }
});
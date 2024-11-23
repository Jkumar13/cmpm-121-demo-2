import "./style.css";

const APP_NAME = "Game";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const appTitle = document.createElement("h1");
appTitle.textContent = "app title";


const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";

document.body.appendChild(appTitle);
document.body.appendChild(canvas);
document.body.appendChild(clearButton);
document.body.appendChild(undoButton);
document.body.appendChild(redoButton);

const ctx = canvas.getContext("2d");

let lines: Array<Array<{ x: number, y: number }>> = [];
let currentLine: Array<{ x: number, y: number }> = [];
let undoStack: Array<Array<{ x: number, y: number }>> = [];
let redoStack: Array<Array<{ x: number, y: number }>> = [];

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
        redoStack = [];
    }
    isDrawing = false;
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

clearButton.addEventListener("click", () => {
    lines = [];
    undoStack = [];
    redoStack = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    // Log the current state of stacks and lines
    console.log("Clear button pressed.");
    logStacks();
});

undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop()!;
        redoStack.push(lastLine); 
        undoStack = []; 

        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
        canvas.dispatchEvent(drawingChangedEvent);

        console.log("Undo button pressed.");
        logStacks();
    }
});

redoButton.addEventListener("click", () => {
    console.log("ok");
    if (redoStack.length > 0) {
        console.log("ok");
        const lastUndoneLine = redoStack.pop()!;
        lines.push(lastUndoneLine);

        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
        canvas.dispatchEvent(drawingChangedEvent);

        console.log("Redo button pressed.");
        logStacks();
    }
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

function logStacks() {
    console.log("Lines:", lines);
    console.log("Undo Stack:", undoStack);
    console.log("Redo Stack:", redoStack);
}
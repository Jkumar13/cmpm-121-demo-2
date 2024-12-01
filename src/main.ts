import "./style.css";

const APP_NAME = "Drawing Site";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const appTitle = document.createElement("h1");
appTitle.textContent = "Draw on the canvas below!";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";

// Marker buttons
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Brush";
const thickButton = document.createElement("button");
thickButton.textContent = "Thick Brush";

document.body.appendChild(appTitle);
document.body.appendChild(canvas);
document.body.appendChild(clearButton);
document.body.appendChild(undoButton);
document.body.appendChild(redoButton);
document.body.appendChild(thinButton);
document.body.appendChild(thickButton);

const ctx = canvas.getContext("2d");

// Command class to represent a drawing operation with thickness
class LineCommand {
    private points: Array<{ x: number, y: number }> = [];
    private thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.points.push({ x, y });
        this.thickness = thickness;
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            this.points.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineWidth = this.thickness; // Set the line thickness
            ctx.stroke();
        }
    }
}

class Sticker {
    x: number;
    y: number;
    emoji: string;
    thickness: number;

    constructor(emoji: string, thickness: number) {
        this.x = 0;
        this.y = 0;
        this.emoji = emoji;
        this.thickness = thickness;
    }

    move(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = '24px Arial';
        ctx.fillText(this.emoji, this.x, this.y);
    }

}

// Tool preview class
class ToolPreviewCommand {
    thickness: number;
    x: number;
    y: number;
    emoji: string;

    constructor(thickness: number) {
        this.thickness = thickness;
        this.x = 0;
        this.y = 0;
    }

    move(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 0, 0, 5)";
        ctx.fill();
    }
}

let lines: Array<LineCommand> = [];
let currentLine: LineCommand | null = null;
let undoStack: Array<LineCommand> = [];
let redoStack: Array<LineCommand> = [];
let toolPreview: ToolPreviewCommand | null = null;
let stickers: Sticker[] = [];

let stickerData = [
    { id: 1, emoji: '🧽' },
    { id: 2, emoji: '🧽' },
    { id: 3, emoji: '😀' }
];

// Event listener for creating a custom sticker
document.getElementById('createStickerButton')?.addEventListener('click', () => {
    const customStickerEmoji = prompt('Custom sticker text: ');
    
    if (customStickerEmoji) {
        // Add the new custom sticker to the sticker list
        const newSticker = { id: stickerData.length + 1, emoji: customStickerEmoji };
        stickerData.push(newSticker);  // Add custom sticker to the array
        console.log("New custom sticker added:", newSticker);
        generateStickerButtons();  // Re-generate buttons with updated stickers
    } else {
        console.log("No custom sticker created.");
    }
});

// Generate buttons for each sticker
function generateStickerButtons() {
    // const stickerButtonContainer = document.getElementById('stickerButtonsContainer');
    
    // Clear previous buttons
    // stickerButtonContainer?.innerHTML = '';

    stickerData.forEach(sticker => {
        const stickerButton = document.createElement('button');
        stickerButton.textContent = sticker.emoji;
            toolPreview = new Sticker(sticker.emoji, 5);  // Set toolPreview to the selected sticker
            canvas.dispatchEvent(new CustomEvent('tool-moved')); // Fire tool-moved event
        
        // stickerButtonContainer?.appendChild(stickerButton);
    });
}

generateStickerButtons();



canvas.addEventListener('mousemove', (event: MouseEvent) => {
    if (!isDrawing && toolPreview) {
        toolPreview.move(event.offsetX, event.offsetY);
        redrawToolPreview();
        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
        canvas.dispatchEvent(drawingChangedEvent);
    }
});

function redrawToolPreview() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas
    if (toolPreview) {
        toolPreview.draw(ctx);  // Draw the tool preview (sticker)
    }
}

function redrawCanvas() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas
    stickers.forEach(sticker => {
        sticker.draw(ctx);
    });
}

canvas.addEventListener('click', (event: MouseEvent) => {
    if (toolPreview instanceof Sticker) {
        const newSticker = new Sticker(toolPreview.emoji, 5);
        newSticker.move(event.offsetX, event.offsetY);
        stickers.push(newSticker);

        toolPreview = null;
        redrawCanvas();
    }
});


let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentThickness = 1; // Default thickness (thin)

// Function to handle tool button selection
function selectTool(button: HTMLButtonElement) {
    const buttons = [thinButton, thickButton];
    buttons.forEach(btn => btn.classList.remove("selectedTool"));
    button.classList.add("selectedTool");

    // Set the current thickness based on the selected tool
    currentThickness = button === thinButton ? 5 : 15;

    // Update the tool preview with the selected thickness
    toolPreview = new ToolPreviewCommand(currentThickness);
}

thinButton.addEventListener("click", () => selectTool(thinButton));
thickButton.addEventListener("click", () => selectTool(thickButton));

function startDrawing(event: MouseEvent) {
    isDrawing = true;
    lastX = event.offsetX;
    lastY = event.offsetY;
    currentLine = new LineCommand(lastX, lastY, currentThickness); // Pass thickness to the line command
}

function draw(event: MouseEvent) {
    if (!isDrawing || !currentLine) return;

    const currentX = event.offsetX;
    const currentY = event.offsetY;

    currentLine.drag(currentX, currentY);

    const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
    canvas.dispatchEvent(drawingChangedEvent);

    lastX = currentX;
    lastY = currentY;
}

function stopDrawing() {
    if (isDrawing && currentLine) {
        lines.push(currentLine);
        undoStack.push(currentLine); // Save the current line to undo stack
        currentLine = null;
        redoStack = []; // Clear redo stack after a new line is drawn
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
    stickers = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    console.log("Clear button pressed.");
    logStacks();
});

undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop()!;
        redoStack.push(lastLine); // Add the last drawn line to redo stack

        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
        canvas.dispatchEvent(drawingChangedEvent);

        console.log("Undo button pressed.");
        logStacks();
    }
});

redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const lastUndoneLine = redoStack.pop()!;
        lines.push(lastUndoneLine); // Restore line to the main canvas

        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
        canvas.dispatchEvent(drawingChangedEvent);

        console.log("Redo button pressed.");
        logStacks();
    }
});

canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach(line => {
        line.display(ctx);
    });

   stickers.forEach(sticker => {
    sticker.draw(ctx);
});

    if (currentLine) {
        currentLine.display(ctx);
    }

    // Draw the tool preview if not drawing
    if (!isDrawing && toolPreview) {
        toolPreview.draw(ctx);
    }
});

canvas.addEventListener("mousemove", (event) => {
    if (!isDrawing && toolPreview instanceof ToolPreviewCommand) {
        toolPreview.move(event.offsetX, event.offsetY);
        const toolMovedEvent = new CustomEvent("tool-moved", { detail: { x: event.offsetX, y: event.offsetY } });
        canvas.dispatchEvent(toolMovedEvent);

        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
        canvas.dispatchEvent(drawingChangedEvent);
    }
});

function logStacks() {
    console.log("Lines:", lines);
    console.log("Undo Stack:", undoStack);
    console.log("Redo Stack:", redoStack);
}

// export button
document.getElementById('exportButton')?.addEventListener('click', () => {
    exportCanvasToPNG();
});

// function to export
function exportCanvasToPNG() {
    // Create a new high-resolution canvas
    const highResCanvas = document.createElement('canvas');
    highResCanvas.width = 1024;
    highResCanvas.height = 1024;

    // get the context for the high-resolution canvas
    const highResCtx = highResCanvas.getContext('2d');
    
    if (!highResCtx) {
        console.error('Failed to get 2D context for high-res canvas.');
        return;
    }

    // scale the context for 4x resolution
    highResCtx.scale(4, 4);

    // draw the lines on the new canvas
    lines.forEach(line => {
        line.display(highResCtx);
    });

    // draw the stickers on the new canvas
    stickers.forEach(sticker => {
        sticker.draw(highResCtx);  // this will be scaled by the highResCtx scale factor
    });

    // trigger a download of the canvas as a PNG file
    const dataUrl = highResCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'high_resolution_drawing.png';
    a.click();
}
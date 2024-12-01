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

// Color Picker for drawing color
const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.value = "#000000";  // Default color is black

// Add elements to the page
document.body.appendChild(appTitle);
document.body.appendChild(canvas);
document.body.appendChild(clearButton);
document.body.appendChild(undoButton);
document.body.appendChild(redoButton);
document.body.appendChild(thinButton);
document.body.appendChild(thickButton);
document.body.appendChild(colorPicker);


const ctx = canvas.getContext("2d");

// Command class to represent a drawing operation with thickness
class LineCommand {
    private points: Array<{ x: number, y: number }> = [];
    private thickness: number;
    private color: string;

    constructor(x: number, y: number, thickness: number, color: string) {
        this.points.push({ x, y });
        this.thickness = thickness;
        this.color = color;
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
            ctx.strokeStyle = this.color;  // Set the stroke color
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

// Generate a random color in hex format
function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
        return `rgb(${r},${g},${b})`;
}

class ToolPreviewCommand {
    thickness: number;
    x: number;
    y: number;
    color: string;

    constructor(thickness: number) {
        this.thickness = thickness;
        this.x = 0;
        this.y = 0;
        this.color = randomColor(); // Set initial random color
    }

    // Update the preview position
    move(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // Draw the preview of the selected tool
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, 2 * Math.PI); // Draw a circle preview
        ctx.fillStyle = this.color;  // Use the randomized color
        ctx.fill();
    }
}




let lines: Array<LineCommand> = [];
let currentLine: LineCommand | null = null;
let undoStack: Array<LineCommand> = [];
let redoStack: Array<LineCommand> = [];
let toolPreview: ToolPreviewCommand | null = null;
let stickers: Sticker[] = [];
let currentColor = colorPicker.value;

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
        generateStickerButtons();  // Re-generate buttons with updated stickers
    }
});

// Generate buttons for each sticker
function generateStickerButtons() {
    stickerData.forEach(sticker => {
        const stickerButton = document.createElement('button');
        stickerButton.textContent = sticker.emoji;
            toolPreview = new Sticker(sticker.emoji, 5);  // Set toolPreview to the selected sticker
            canvas.dispatchEvent(new CustomEvent('tool-moved')); // Fire tool-moved event
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
    if (toolPreview) {
        toolPreview.draw(ctx);  // Draw the tool preview (sticker)
    }
}

function redrawCanvas() {
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
let currentThickness = 1;

// Update the color when the user selects a new color
colorPicker.addEventListener('input', (event: Event) => {
    currentColor = (event.target as HTMLInputElement).value;  // Get the selected color
});

function selectTool(button: HTMLButtonElement) {
    const buttons = [thinButton, thickButton];
    buttons.forEach(btn => btn.classList.remove("selectedTool"));
    button.classList.add("selectedTool");

    // Randomize the thickness based on the selected tool
    currentThickness = button === thinButton ? 7 : 20;

    // Create a new tool preview with the selected thickness and color
    toolPreview = new ToolPreviewCommand(currentThickness);

    // Generate a random color for the tool and brush
    const randomToolColor = toolPreview.color;

    // Set the brush color to the random color
    currentColor = randomToolColor;
    canvas.dispatchEvent(new CustomEvent('tool-moved'));
}

thinButton.addEventListener("click", () => selectTool(thinButton));
thickButton.addEventListener("click", () => selectTool(thickButton));

function startDrawing(event: MouseEvent) {
    isDrawing = true;
    lastX = event.offsetX;
    lastY = event.offsetY;
    currentLine = new LineCommand(lastX, lastY, currentThickness, currentColor); // Pass thickness to the line command
}

// Create a color display element to show the selected color
const colorDisplay = document.createElement("div");
colorDisplay.style.width = "50px";
colorDisplay.style.height = "50px";
colorDisplay.style.backgroundColor = currentColor;
colorDisplay.style.border = "1px solid #000";
document.body.appendChild(colorDisplay);

// Update the color display when the color changes
colorPicker.addEventListener('input', (event: Event) => {
    currentColor = (event.target as HTMLInputElement).value;
    colorDisplay.style.backgroundColor = currentColor;  // Update the display to show the selected color
});

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
});

undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop()!;
        redoStack.push(lastLine); // Add the last drawn line to redo stack

        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
        canvas.dispatchEvent(drawingChangedEvent);
    }
});

redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const lastUndoneLine = redoStack.pop()!;
        lines.push(lastUndoneLine); // Restore line to the main canvas

        const drawingChangedEvent = new CustomEvent("drawing-changed", { detail: { lines } });
        canvas.dispatchEvent(drawingChangedEvent);
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
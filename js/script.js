const form = document.getElementById("generate-form");
const qr = document.getElementById("qrcode");

// Button submit
const onGenerateSubmit = (e) => {
  e.preventDefault();

  clearUI();

  const url = document.getElementById("url").value;
  const size = document.getElementById("size").value;

  // Validate url
  if (url === "") {
    alert("Please enter a URL");
  } else {
    showSpinner();
    // Show spinner for 1 sec
    setTimeout(() => {
      hideSpinner();
      generateQRCode(url, size);

      // Generate the download buttons after the qr code image src is ready
      setTimeout(() => {
        createDownloadButtons();
      }, 50);
    }, 1000);
  }
};

// Generate QR code
const generateQRCode = (url, size) => {
  const qrcode = new QRCode("qrcode", {
    text: url,
    width: size,
    height: size,
  });
};

// Clear QR code and download buttons
const clearUI = () => {
  qr.innerHTML = "";
  const btns = document.getElementById("download-btns");
  if (btns) {
    btns.remove();
  }
};

// Show spinner
const showSpinner = () => {
  const spinner = document.getElementById("spinner");
  spinner.style.display = "block";
};

// Hide spinner
const hideSpinner = () => {
  const spinner = document.getElementById("spinner");
  spinner.style.display = "none";
};

// Get the QR canvas (library hides it but it stays in the DOM)
const getQRCanvas = () => qr.querySelector("canvas");

// Download the QR code in the given format: "png", "jpg", or "svg"
const downloadAs = (format) => {
  const canvas = getQRCanvas();

  if (format === "svg") {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const svgContent = canvasToSVG(imageData, canvas.width, canvas.height);
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "qrcode.svg");
    URL.revokeObjectURL(url);
    return;
  }

  // For PNG and JPG: draw on a white-background canvas (avoids transparent bg for JPG)
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(canvas, 0, 0);

  if (format === "jpg") {
    triggerDownload(tempCanvas.toDataURL("image/jpeg", 0.95), "qrcode.jpg");
  } else {
    triggerDownload(tempCanvas.toDataURL("image/png"), "qrcode.png");
  }
};

// Convert canvas pixel data to a compact SVG string.
// Strategy: scan pixel rows, merge consecutive rows with the same dark-run pattern
// into taller rects. No module-size detection needed — identical rows within a QR
// module collapse automatically, reducing rect count by ~moduleSize×.
const canvasToSVG = (imageData, width, height) => {
  const data = imageData.data;

  // Returns an array of [x, runWidth] pairs for all dark runs in row y
  const rowRuns = (y) => {
    const runs = [];
    let x = 0;
    while (x < width) {
      if (data[(y * width + x) * 4] < 128) {
        let end = x;
        while (end + 1 < width && data[(y * width + end + 1) * 4] < 128) end++;
        runs.push(x, end - x + 1);
        x = end + 1;
      } else {
        x++;
      }
    }
    return runs;
  };

  const runsEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  let rects = "";
  const flush = (runs, startY, h) => {
    for (let i = 0; i < runs.length; i += 2) {
      rects += `<rect x="${runs[i]}" y="${startY}" width="${runs[i + 1]}" height="${h}"/>`;
    }
  };

  let prev = [];
  let startY = 0;
  let span = 0;

  for (let y = 0; y < height; y++) {
    const cur = rowRuns(y);
    if (runsEqual(cur, prev)) {
      span++;
    } else {
      if (span > 0) flush(prev, startY, span);
      prev = cur;
      startY = y;
      span = 1;
    }
  }
  if (span > 0) flush(prev, startY, span);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="white"/><g fill="black">${rects}</g></svg>`;
};

const triggerDownload = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
};

// Create download buttons for PNG, JPG and SVG
const createDownloadButtons = () => {
  const container = document.createElement("div");
  container.id = "download-btns";
  container.className = "flex gap-3 justify-center my-5";

  const btnClass =
    "text-white font-bold py-2 px-4 rounded hover:bg-black cursor-pointer";

  const formats = [
    { label: "Download PNG", format: "png", color: "bg-green-500" },
    { label: "Download JPG", format: "jpg", color: "bg-blue-500" },
    { label: "Download SVG", format: "svg", color: "bg-purple-500" },
  ];

  for (const { label, format, color } of formats) {
    const btn = document.createElement("button");
    btn.className = `${color} ${btnClass}`;
    btn.textContent = label;
    btn.addEventListener("click", () => downloadAs(format));
    container.appendChild(btn);
  }

  document.getElementById("generated").appendChild(container);
};

hideSpinner();

form.addEventListener("submit", onGenerateSubmit);

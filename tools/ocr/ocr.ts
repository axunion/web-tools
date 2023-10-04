import "./ocr.css";
import { createWorker, Worker, RecognizeResult } from "tesseract.js";

const imageUpload = document.getElementById("imageUpload");
const startOcr = document.getElementById("startOcr");
const ocrResult = document.getElementById("ocrResult");
const loadingIndicator = document.getElementById("loadingIndicator");

if (
  !(imageUpload instanceof HTMLInputElement) ||
  !(startOcr instanceof HTMLButtonElement) ||
  !(ocrResult instanceof HTMLTextAreaElement) ||
  !(loadingIndicator instanceof HTMLDivElement)
) {
  console.error("Cannot find the required HTML elements");
  throw new Error("Missing HTML elements");
}

const worker: Worker = await createWorker();

const performOcr = async (
  imageFile: File
): Promise<RecognizeResult["data"]> => {
  await worker.loadLanguage("eng+jpn");
  await worker.initialize("eng+jpn");

  const { data }: RecognizeResult = await worker.recognize(imageFile);
  await worker.terminate();

  return data;
};

startOcr.addEventListener("click", async () => {
  if (!imageUpload.files || imageUpload.files.length === 0) {
    alert("Please select an image file");
    return;
  }

  ocrResult.textContent = "";
  loadingIndicator.style.display = "flex";

  const data = await performOcr(imageUpload.files[0]);

  loadingIndicator.style.display = "none";
  ocrResult.textContent = data.text.replace(/\|/g, "\t");
});

ocrResult.addEventListener("click", function () {
  this.select();
});

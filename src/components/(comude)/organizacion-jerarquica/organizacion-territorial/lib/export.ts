"use client";

import { domToCanvas } from "modern-screenshot";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

function getBgColor(): string {
  return document.documentElement.classList.contains("dark")
    ? "#18181b"
    : "#ffffff";
}

export async function exportTerritorialToPng(elementId: string, filename = "Estructura_Territorial.png") {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("No se encontró el elemento a exportar.");

  const canvas = await domToCanvas(el, {
    scale: 2,
    backgroundColor: getBgColor(),
  });

  canvas.toBlob((blob) => {
    if (blob) {
      saveAs(blob, filename);
    }
  }, "image/png");
}

export async function exportTerritorialToPdf(elementId: string, filename = "Estructura_Territorial.pdf") {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("No se encontró el elemento a exportar.");

  const canvas = await domToCanvas(el, {
    scale: 2,
    backgroundColor: getBgColor(),
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(filename);
}

const fs = require("fs");
const fetch = require("node-fetch");

const sheetUrl =
  "https://docs.google.com/spreadsheets/d/1TF2hAiXg5KfLARRnVSdT0YroW3su0f3K-iERs2RZjAw/pub?output=csv&gid=56605794";

async function fetchSheetData() {
  try {
    const response = await fetch(sheetUrl);
    const data = await response.text();

    const rows = data.split("\n").map((row) => row.split(","));
    const headers = rows[0];
    const products = rows.slice(1).map((row) => ({
      productName: row[0] || "",
      unitOfMeasure: row[1] || "",
      salesPrice: row[2] || "",
      indent: row[3].trim().toUpperCase() === "TRUE",
    }));

    fs.writeFileSync("products.json", JSON.stringify(products, null, 2));
    console.log("Data updated successfully");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

fetchSheetData();

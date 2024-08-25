import PocketBase from "pocketbase";
import fetch from "node-fetch";
import cliProgress from "cli-progress";

const pb = new PocketBase(process.env.POCKETHOST_URL);
const COLLECTION_NAME = "wholesalepricelist";

async function updateSheetData() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETHOST_EMAIL,
      process.env.POCKETHOST_PASSWORD,
    );

    console.log(
      `PocketBase SDK version: ${PocketBase.version || "Not available"}`,
    );
    console.log(`Connected to PocketBase at: ${process.env.POCKETHOST_URL}`);

    await ensureCollectionExists();

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = "1TF2hAiXg5KfLARRnVSdT0YroW3su0f3K-iERs2RZjAw";
    const sheetName = "Sheet1";
    const range = "A1:D";

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}?key=${apiKey}`;

    console.log("Fetching data from Google Sheets...");
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.values && data.values.length > 1) {
      console.log(`Found ${data.values.length - 1} rows of data`);
      await updateData(data.values.slice(1));
      console.log("Data update process completed");
    } else {
      console.log("No data found in the Google Sheet or sheet is empty");
      console.log("Sheet data:", data);
    }
  } catch (error) {
    console.error("Error updating data:", error);
    process.exit(1);
  }
}

async function ensureCollectionExists() {
  try {
    await pb.collections.getOne(COLLECTION_NAME);
    console.log(`${COLLECTION_NAME} collection exists`);
  } catch (error) {
    if (error.status === 404) {
      console.log(`${COLLECTION_NAME} collection not found. Creating...`);
      await pb.collections.create({
        name: COLLECTION_NAME,
        type: "base",
        schema: [
          {
            name: "productName",
            type: "text",
            required: true,
          },
          {
            name: "unitOfMeasure",
            type: "text",
          },
          {
            name: "salesPrice",
            type: "text",
          },
          {
            name: "indent",
            type: "bool",
          },
        ],
      });
      console.log(`${COLLECTION_NAME} collection created successfully`);
    } else {
      throw error;
    }
  }
}

async function updateData(rows) {
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  progressBar.start(rows.length, 0);

  let updatedCount = 0;
  let insertedCount = 0;
  let unchangedCount = 0;

  for (let [index, row] of rows.entries()) {
    try {
      const productName = row[0] || "";
      const newData = {
        productName: productName,
        unitOfMeasure: row[1] || "",
        salesPrice: row[2] || "",
        indent: row[3] === "TRUE",
      };

      // Try to find an existing record
      const existingRecords = await pb.collection(COLLECTION_NAME).getFullList({
        filter: `productName = "${productName}"`,
      });

      if (existingRecords.length > 0) {
        const existingRecord = existingRecords[0];
        // Check if the record needs updating
        if (
          JSON.stringify(newData) !==
          JSON.stringify({
            productName: existingRecord.productName,
            unitOfMeasure: existingRecord.unitOfMeasure,
            salesPrice: existingRecord.salesPrice,
            indent: existingRecord.indent,
          })
        ) {
          await pb
            .collection(COLLECTION_NAME)
            .update(existingRecord.id, newData);
          updatedCount++;
        } else {
          unchangedCount++;
        }
      } else {
        // Insert new record if it doesn't exist
        await pb.collection(COLLECTION_NAME).create(newData);
        insertedCount++;
      }
    } catch (error) {
      console.error("Error processing row:", error);
    }
    progressBar.update(index + 1);
  }

  progressBar.stop();
  console.log(
    `Updated ${updatedCount} records, inserted ${insertedCount} new records, ${unchangedCount} records unchanged`,
  );

  // Delete records that are no longer in the sheet
  const allRecords = await pb.collection(COLLECTION_NAME).getFullList();
  const sheetProductNames = new Set(rows.map((row) => row[0]));
  let deletedCount = 0;

  for (let record of allRecords) {
    if (!sheetProductNames.has(record.productName)) {
      await pb.collection(COLLECTION_NAME).delete(record.id);
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} records that were not in the sheet`);
}

updateSheetData();

import PocketBase from "pocketbase";
import fetch from "node-fetch";
import cliProgress from "cli-progress";
import fs from "fs";
import { setTimeout } from "timers/promises";

const pb = new PocketBase(process.env.POCKETHOST_URL);
pb.autoCancellation(false);
pb.setTimeout(30000); // 30 seconds
const COLLECTION_NAME = "wholesalepricelist";

async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(
        `Operation failed (attempt ${i + 1}/${maxRetries}):`,
        error,
      );
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await setTimeout(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

async function updateSheetData() {
  try {
    // ... (rest of the function remains the same) ...
  } catch (error) {
    console.error("Error updating data:", error);
    fs.appendFileSync(
      "updateSheetData.log",
      `Error: ${error}\n${error.stack}\n`,
    );
    process.exit(1);
  }
}

async function ensureCollectionExists() {
  // ... (function remains the same) ...
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

  const batchSize = 10; // Reduced batch size
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await retryOperation(async () => {
      for (const row of batch) {
        try {
          const productName = row[0] || "";
          const newData = {
            productName: productName,
            unitOfMeasure: row[1] || "",
            salesPrice: row[2] || "",
            indent: row[3] === "TRUE",
          };

          const existingRecords = await pb
            .collection(COLLECTION_NAME)
            .getFullList({
              filter: `productName = "${productName}"`,
            });

          if (existingRecords.length > 0) {
            const existingRecord = existingRecords[0];
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
            await pb.collection(COLLECTION_NAME).create(newData);
            insertedCount++;
          }
        } catch (error) {
          console.error("Error processing row:", error);
          fs.appendFileSync(
            "error_log.txt",
            `Row: ${JSON.stringify(row)}\nError: ${error}\n\n`,
          );
        }
        await setTimeout(100); // Small delay between each row
      }
    });
    progressBar.update(i + batch.length);
    await setTimeout(1000); // Delay between batches
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
      await retryOperation(() =>
        pb.collection(COLLECTION_NAME).delete(record.id),
      );
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} records that were not in the sheet`);
}

try {
  updateSheetData();
} catch (error) {
  console.error("Unhandled error:", error);
  fs.appendFileSync(
    "updateSheetData.log",
    `Unhandled Error: ${error}\n${error.stack}\n`,
  );
  process.exit(1);
}

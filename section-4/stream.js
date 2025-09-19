// 🔹 Example 1: Reading a File with Stream

// const fs = require("fs");

// const readable = fs.createReadStream("test.txt", {
//   encoding: "utf-8",
//   highWaterMark: 1024 // read 1KB at a time
// });

// readable.on("data", (chunk) => {
//   console.log("Received chunk:", chunk.length);
// });

// readable.on("end", () => {
//   console.log("File reading finished");
// });

// readable.on("error", (err) => {
//   console.error("Error:", err);
// });

// 🔹 Example 2: Writing to a File with Stream

// const fs = require("fs");

// const writable = fs.createWriteStream("output.txt");

// writable.write("Hello, ");
// writable.write("world!\n");

// writable.end("Done writing."); // closes the stream

// writable.on("finish", () => {
//   console.log("All data written successfully!");
// });

// 🔹 Example 3: Piping (Read → Write)

// const fs = require("fs");

// const readable = fs.createReadStream("test.txt");
// const writable = fs.createWriteStream("output.txt");

// readable.pipe(writable); // pipes data from read stream to write stream

// console.log("Data is being copied via stream...");

// 🔹 Example 4: Transform Stream (Compression)

// const fs = require("fs");
// const zlib = require("zlib");

// const readable = fs.createReadStream("test.txt");
// const compressed = fs.createWriteStream("test.txt.gz");

// readable.pipe(zlib.createGzip()).pipe(compressed);

// console.log("File compressed successfully!");

// Preloaded into the program by a test (NODE_OPTIONS=--require <this file>): every http or https request the program makes is written to the file named by IHP_REFUSED
// and refused, so a test can see where the program would have gone without a single request leaving this computer (a test that must not reach the real server
// of the product, whatever network the computer has).
const fs = require("node:fs");

for (const name of ["https", "http"]) {
  const mod = require(`node:${name}`);
  mod.request = (url) => {
    fs.appendFileSync(process.env.IHP_REFUSED, `${typeof url === "string" ? url : (url && url.href) || ""}\n`);
    throw new Error("refused: this test does not reach the network");
  };
}

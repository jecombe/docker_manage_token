import { Analyze } from "./srcs/core/Analyze.js";

(async () => {
  try {
    const analyze = new Analyze();
    await analyze.init();
    analyze.startApp();
  } catch (error) {
    console.log(error);
  }
})();

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: ".env",
});

const port = process.env.PORT || 8000;

(async () => {
  try {
    await connectDB();

    app.on("error", (error) => {
      throw new Error(`Express app error: ${error.message}`)
    });

    app.listen(port, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
    
  } catch (error) {
    console.log("connection failed", error);
  }
})();
import express from "express";
import cors from "cors";
import loginRoutes from "./routes/loginRoutes";
import userRoutes from "./routes/userRoutes";
import loanRoutes from "./routes/loanRoutes";

const app = express();
const PORT =  3007;


app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api/v1/login", loginRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/loans", loanRoutes);


// Start the server
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});

const express = require("express");
const cors = require("cors");
const decodeToken = require("./auth-middleware");
const admin = require("./src/config/firebase-config");
const helmet = require("helmet");
const db = require("./database");

const app = express();
const port = 3000;
app.use(helmet());
app.use(cors());
app.use(decodeToken);

app.get("/api/todo", (req, res) => {
  res.json({
    todos: [
      {
        id: 1,
        title: "Todo One",
      },
      {
        id: 2,
        title: "Todo Two",
      },
      {
        id: 3,
        title: "Todo Three",
      },
    ],
  });
});

const startServer = async () => {
  await admin.initializeFirebaseApp();
  app.listen(port, () => {
    console.log(`Expense-core listening at http://localhost:${port}`);
  });
};

startServer();

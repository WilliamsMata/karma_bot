const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CNN);
    console.log("Database online");
  } catch (error) {
    console.log(error);
    throw new Error("Error when starting the database");
  }
};

module.exports = {
  dbConnection,
};

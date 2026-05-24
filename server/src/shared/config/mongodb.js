import mongoose from "mongoose";
import config from "./index.js";
import logger from "./logger.js";

class MongoConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      if(this.connection) {
        logger.info("MongoDB Already Connected!");
        return this.connection;
      }

      await mongoose.connect(config.mongo.uri, {
        dbName: config.mongo.dbName
      });
      this.connection = mongoose.connection;
      logger.info(`MongoDB connected: ${config.mongo.uri}`);

      this.connection.on("error", err => {
        logger.error("MongoDB connection error", err);
      });

      this.connection.on("disconnect", () => {
        logger.info("MongoDB disconnected");
      });

      return this.connection;
    } catch (error) {
      logger.error("Failed to connect to MongoDB: ", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if(this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info("MongoDB disconnected!");
      }
    } catch (error) {
      logger.error("Failed to disconnect MongoDB: ", error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

export default new MongoConnection();
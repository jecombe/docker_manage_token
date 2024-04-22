"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const logger_js_1 = require("../utils/logger.js");
const DataBase_js_1 = require("./DataBase.js");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const Contract_js_1 = require("./Contract.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT_SERVER;
class Server extends DataBase_js_1.DataBase {
    constructor() {
        super();
        this.contract = null;
    }
    setManager(manager) {
        this.contract = new Contract_js_1.Contract(manager);
    }
    startApp() {
        const corsOptions = {
            origin: "*",
            optionsSuccessStatus: 200,
        };
        app.use((0, cors_1.default)(corsOptions));
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: false }));
        app.listen(port, () => {
            logger_js_1.loggerServer.info(`Server is listening on port ${port}`);
        });
    }
    getAllVolumesDaily() {
        app.get("/api/get-all-volumes", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_js_1.loggerServer.trace(`get-all-volumes - Receive request from: ${req.ip}`);
                res.json(yield this.getAllVolumes());
            }
            catch (error) {
                logger_js_1.loggerServer.fatal(`get-all-volumes: ${req.ip}`, error);
                res.status(500).send("Error intern server get all volumes");
            }
        }));
    }
    deleteDatabase() {
        app.delete("/api/delete-database", (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                logger_js_1.loggerServer.trace(`delete-database - Receive request from: ${req.ip}`);
                (_a = this.contract) === null || _a === void 0 ? void 0 : _a.resetFetching();
                yield this.deleteAllData();
                yield this.deleteAllVolumes();
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    var _b;
                    (_b = this.contract) === null || _b === void 0 ? void 0 : _b.startAfterReset();
                }), 10000);
                res.json("delete database ok");
            }
            catch (error) {
                logger_js_1.loggerServer.fatal(`delete-database: ${req.ip}`, error);
                res.status(500).send("Error intern server delete");
            }
        }));
    }
    getAllData() {
        app.get("/api/get-all", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_js_1.loggerServer.trace(`get-all - Receive request from: ${req.ip}`);
                res.json(yield this.getData());
            }
            catch (error) {
                logger_js_1.loggerServer.fatal(`get-all: ${req.ip}`, error);
                res.status(500).send("Error intern server delete");
            }
        }));
    }
    getAllLogsFromAddr() {
        app.get("/api/get-all-addr", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_js_1.loggerServer.trace(`get-all-addr - Receive request from: ${req.ip}`);
                res.json(yield this.getAllDataFromAddr(`${req.query.userAddress}`));
            }
            catch (error) {
                logger_js_1.loggerServer.fatal(`get-all-addr: ${req.ip}`, error);
                res.status(500).send("Error intern server delete");
            }
        }));
    }
    getTransactions() {
        app.get("/api/get-all-transac", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_js_1.loggerServer.trace(`get-all-transac - Receive request from: ${req.ip}`);
                res.json(yield this.getAllTx());
            }
            catch (error) {
                logger_js_1.loggerServer.fatal(`get-all-transac: ${req.ip}`, error);
                res.status(500).send("Error intern server delete");
            }
        }));
    }
    getTransactionsFromAddr() {
        app.get("/api/get-all-transac-addr", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_js_1.loggerServer.trace(`get-all-transac-addr - Receive request from: ${req.ip}`);
                res.json(yield this.getTransfersFromAddress(`${req.query.userAddress}`));
            }
            catch (error) {
                logger_js_1.loggerServer.fatal(`get-all-transac-addr: ${req.ip}`, error);
                res.status(500).send("Error intern server delete");
            }
        }));
    }
    getAllowances() {
        app.get("/api/get-all-allowances", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_js_1.loggerServer.trace(`get-all-allowances - Receive request from: ${req.ip}`);
                res.json(yield this.getAllAproval());
            }
            catch (error) {
                logger_js_1.loggerServer.fatal(`get-all-transac: ${req.ip}`, error);
                res.status(500).send("Error intern server delete");
            }
        }));
    }
    getAllowancesFromAddr() {
        app.get("/api/get-all-allowances-addr", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_js_1.loggerServer.trace(`get-all-allowances-addr - Receive request from`, req.ip);
                res.json(yield this.getAllowanceFromAddress(`${req.query.userAddress}`));
            }
            catch (error) {
                logger_js_1.loggerServer.fatal(`get-all-allowances-addr: ${req.ip}`, error);
                res.status(500).send("Error intern server delete");
            }
        }));
    }
    getApi() {
        this.deleteDatabase();
        this.getAllData();
        this.getAllLogsFromAddr();
        this.getTransactions();
        this.getTransactionsFromAddr();
        this.getAllowances();
        this.getAllowancesFromAddr();
        this.getAllVolumesDaily();
        logger_js_1.loggerServer.info("Api is started");
    }
    saveTx(array) {
        array.map((el) => {
            if (el.blocknumber !== undefined && this.contract) {
                this.contract.saveTx.push(el.transactionhash);
            }
        });
    }
    saveTime(array) {
        array.map((el) => {
            if (el.timestamp !== undefined && this.contract) {
                this.contract.saveTime.push(el.timestamp);
            }
        });
    }
    startFetchingLogs() {
        var _a;
        (_a = this.contract) === null || _a === void 0 ? void 0 : _a.startListener((logs) => {
            logger_js_1.loggerServer.trace("Receive logs: ", logs);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                this.startApp();
                this.getApi();
                yield this.startBdd();
                const readAll = yield this.getData();
                this.saveTx(readAll);
                const allVolumes = yield this.getAllVolumes();
                this.saveTime(allVolumes);
                (_a = this.contract) === null || _a === void 0 ? void 0 : _a.startListeningEvents();
            }
            catch (error) {
                logger_js_1.loggerServer.error("start", error);
                throw error;
            }
        });
    }
}
exports.Server = Server;

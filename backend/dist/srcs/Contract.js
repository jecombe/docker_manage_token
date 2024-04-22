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
exports.Contract = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const viem_1 = require("viem");
const logger_js_1 = require("../utils/logger.js");
const Viem_js_1 = require("./Viem.js");
const lodash_1 = __importDefault(require("lodash"));
const utils_js_1 = require("../utils/utils.js");
const abi_js_1 = __importDefault(require("../utils/abi.js"));
dotenv_1.default.config();
class Contract extends Viem_js_1.Viem {
    constructor(manager) {
        super();
        this.manager = manager;
        this.timeVolume = null;
        this.saveTx = [];
        this.saveTime = [];
        this.index = 0;
        this.isFetching = true;
        this.blockNumber = BigInt(0);
        this.isContractPrev = BigInt(0);
        this.timePerRequest = this.getRateLimits();
    }
    startAfterReset() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.isFetching = true;
                yield this.getLogsContract();
            }
            catch (error) {
                logger_js_1.loggerServer.fatal("resetFetching: ", error);
                this.isFetching = false;
            }
        });
    }
    resetFetching() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isFetching = false;
            this.index = 0;
            this.saveTime = [];
            this.saveTx = [];
        });
    }
    parseNumberToEth(number) {
        const numberBigInt = BigInt(number);
        return Number((0, viem_1.formatEther)(numberBigInt));
    }
    ;
    initParsingLog(currentLog) {
        return {
            eventName: currentLog.eventName,
            from: "",
            to: "",
            blockNumber: currentLog.blockNumber.toString(),
            value: 0,
            transactionHash: currentLog.transactionHash,
        };
    }
    parseResult(logs) {
        return logs.reduce((accumulator, currentLog) => {
            const parsedLog = this.initParsingLog(currentLog);
            if (currentLog.eventName === "Transfer" && currentLog.args.from && currentLog.args.to) {
                parsedLog.from = currentLog.args.from;
                parsedLog.to = currentLog.args.to;
                parsedLog.value = this.parseNumberToEth(`${currentLog.args.value}`);
                parsedLog.transactionHash = currentLog.transactionHash;
            }
            else if (currentLog.eventName === "Approval" && currentLog.args.owner && currentLog.args.sender) {
                parsedLog.from = currentLog.args.owner;
                parsedLog.to = currentLog.args.sender;
                parsedLog.value = this.parseNumberToEth(`${currentLog.args.value}`);
                parsedLog.transactionHash = currentLog.transactionHash;
            }
            else
                logger_js_1.loggerServer.info("Uknow envent come here: ", currentLog);
            accumulator.push(parsedLog);
            return accumulator;
        }, []);
    }
    sendVolumeDaily(volume) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.timeVolume && !lodash_1.default.includes(this.saveTime, this.timeVolume)) {
                return this.manager.insertDataVolumes(this.timeVolume, volume);
            }
            else {
                logger_js_1.loggerServer.warn("is Exist");
                //this.manager.getVolumeByDate();
            }
        });
    }
    sendData(parsed, volume) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.sendVolumeDaily(volume);
                for (const el of parsed) {
                    if (!lodash_1.default.includes(this.saveTx, el.transactionHash)) {
                        yield this.manager.insertDataLogs(el);
                        this.saveTx.push(el.transactionHash);
                    }
                }
            }
            catch (error) {
                logger_js_1.loggerServer.fatal("sendData: ", error);
                throw error;
            }
        });
    }
    isExist(array) {
        return array.reduce((acc, el) => {
            if (!lodash_1.default.includes(this.saveTx, el.transactionHash)) {
                acc.push(el);
            }
            return acc;
        }, []);
    }
    getRangeBlock(batchSize) {
        const fromBlock = this.blockNumber - batchSize * BigInt(this.index + 1);
        const toBlock = this.blockNumber - batchSize * BigInt(this.index);
        return { fromBlock, toBlock };
    }
    getBatchLogs(fromBlock, toBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cliPublic.getLogs({
                address: `0x${process.env.CONTRACT}`,
                events: (0, viem_1.parseAbi)([
                    "event Approval(address indexed owner, address indexed sender, uint256 value)",
                    "event Transfer(address indexed from, address indexed to, uint256 value)"
                ]),
                fromBlock,
                toBlock,
            });
        });
    }
    getLogsOwnerShip(fromBlock, toBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cliPublic.getLogs({
                address: `0x${process.env.CONTRACT}`,
                events: (0, viem_1.parseAbi)([
                    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
                ]),
                fromBlock,
                toBlock,
            });
        });
    }
    calculateVolume(logs) {
        let volume = BigInt(0);
        for (const log of logs) {
            if (log.eventName === 'Transfer') {
                volume += BigInt(log.value);
            }
        }
        return `${volume}`;
    }
    savingTx(parsed) {
        parsed.map((el) => {
            lodash_1.default.union(this.saveTx, el.transactionHash);
        });
    }
    sendLogsWithCheck(parsed) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!lodash_1.default.isEmpty(parsed)) {
                    const checkExisting = this.isExist(parsed);
                    if (!lodash_1.default.isEmpty(checkExisting)) {
                        logger_js_1.loggerServer.trace("Adding new thing: ", checkExisting, parsed, this.saveTx);
                        yield this.sendData(checkExisting, Number(this.calculateVolume(parsed)));
                    }
                    else {
                        logger_js_1.loggerServer.error("Log already existe", parsed);
                    }
                }
            }
            catch (error) {
                logger_js_1.loggerServer.fatal("sendLogsWithCheck", error);
                throw error;
            }
        });
    }
    loggingDate() {
        const dateRemoveHours = (0, utils_js_1.removeTimeFromDate)((this === null || this === void 0 ? void 0 : this.timeVolume) || new Date());
        logger_js_1.loggerServer.trace("Analyze Data for day: ", dateRemoveHours.toISOString().split('T')[0]);
    }
    contractIsPreviousOwner(obj) {
        if (obj.eventName !== "OwnershipTransferred")
            return BigInt(0);
        if (obj.args.previousOwner === "0x0000000000000000000000000000000000000000") {
            return obj.blockNumber;
        }
        return BigInt(0);
    }
    manageProcessRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fromBlock, toBlock } = this.getRangeBlock(BigInt((0, utils_js_1.calculateBlocksPerDay)(this.manager.config.timeBlock)));
                const batchLogs = yield this.getBatchLogs(fromBlock, toBlock);
                const owner = yield this.getLogsOwnerShip(fromBlock, toBlock);
                if (!lodash_1.default.isEmpty(owner))
                    this.isContractPrev = this.contractIsPreviousOwner(owner[0]);
                return this.parseResult(batchLogs);
            }
            catch (error) {
                logger_js_1.loggerServer.fatal("manageProcessRequest", error);
                throw error;
            }
        });
    }
    getEventsLogsFrom() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.isContractPrev = BigInt(0);
                if (!this.isFetching)
                    return true;
                this.loggingDate();
                const parsed = yield this.manageProcessRequest();
                yield this.sendLogsWithCheck(parsed);
                this.index++;
                if (this.timeVolume)
                    this.timeVolume = (0, utils_js_1.subtractOneDay)(this.timeVolume);
                if (this.isContractPrev !== BigInt(0))
                    return true;
                return false;
            }
            catch (error) {
                logger_js_1.loggerServer.fatal("getEventsLogsFrom: ", error);
                throw error;
            }
        });
    }
    getRateLimits() {
        const requestsPerMinute = 1800;
        const millisecondsPerMinute = 60000;
        return millisecondsPerMinute / requestsPerMinute;
    }
    ;
    newFetching() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.timeVolume = (0, utils_js_1.removeTimeFromDate)(new Date());
                this.blockNumber = BigInt(yield this.getActualBlock());
                logger_js_1.loggerServer.info("new fetching with actual block: ", this.blockNumber.toString());
            }
            catch (error) {
                logger_js_1.loggerServer.fatal("newFetching: ", error);
                this.timeVolume = (0, utils_js_1.removeTimeFromDate)(new Date());
                this.blockNumber = BigInt(0);
                throw error;
            }
        });
    }
    getLogsContract() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.newFetching();
                while (this.isFetching) {
                    const isStop = yield this.processLogsBatch();
                    yield (0, utils_js_1.waiting)(this.manager.config.waiting);
                    if (isStop) {
                        logger_js_1.loggerServer.warn("process fetching is stop -> smart contract is born");
                        this.index = 0;
                        logger_js_1.loggerServer.info("waiting for a new fetching...");
                        yield (0, utils_js_1.waiting)(this.manager.config.waiting);
                        yield this.newFetching();
                    }
                }
            }
            catch (error) {
                logger_js_1.loggerServer.fatal("getLogsContract: ", error);
                this.isFetching = false;
                throw error;
            }
        });
    }
    ;
    waitingRate(batchStartTime, timePerRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const elapsedTime = Date.now() - batchStartTime;
            const waitTime = Math.max(0, timePerRequest - elapsedTime);
            logger_js_1.loggerServer.debug("Elapsed time:", elapsedTime, "Wait time:", waitTime);
            return (0, utils_js_1.waiting)(waitTime);
        });
    }
    ;
    processLogsBatch() {
        return __awaiter(this, void 0, void 0, function* () {
            const batchStartTime = Date.now();
            try {
                const isStop = yield this.getEventsLogsFrom();
                yield this.waitingRate(batchStartTime, this.timePerRequest);
                return isStop;
            }
            catch (error) {
                logger_js_1.loggerServer.error("processLogsBatch: ", error);
                throw error;
            }
        });
    }
    ;
    startListener(callback) {
        logger_js_1.loggerServer.info("Listening Events smart contract...");
        return this.cliPublic.watchContractEvent({
            address: `0x${process.env.CONTRACT}`,
            abi: abi_js_1.default,
            onLogs: callback,
        });
    }
    startListeningEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //this.startListener();
                yield this.getLogsContract();
            }
            catch (error) {
                logger_js_1.loggerServer.fatal("startListeningEvents: ", error);
                throw error;
            }
        });
    }
}
exports.Contract = Contract;

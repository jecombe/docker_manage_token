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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTimestamp = exports.removeTimeFromDate = exports.subtractOneDay = exports.getAbiEvent = exports.calculateBlocksPerDay = exports.existsBigIntInArray = exports.waiting = void 0;
const waiting = (timer) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => setTimeout(resolve, timer));
});
exports.waiting = waiting;
const existsBigIntInArray = (arr, value) => {
    return arr.some((item) => item === value);
};
exports.existsBigIntInArray = existsBigIntInArray;
const calculateBlocksPerDay = (blockIntervalSeconds) => {
    const secondsInDay = 24 * 60 * 60;
    const blocksPerDay = secondsInDay / blockIntervalSeconds;
    return Math.round(blocksPerDay);
};
exports.calculateBlocksPerDay = calculateBlocksPerDay;
const getAbiEvent = () => {
    return [
        "event Approval(address indexed owner, address indexed sender, uint256 value)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
    ];
};
exports.getAbiEvent = getAbiEvent;
const subtractOneDay = (currentDate) => {
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const currentTimestamp = currentDate.getTime();
    const newTimestamp = currentTimestamp - oneDayInMilliseconds;
    return new Date(newTimestamp);
};
exports.subtractOneDay = subtractOneDay;
const removeTimeFromDate = (currentDate) => {
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    const day = currentDate.getUTCDate();
    const dateOnly = new Date(Date.UTC(year, month, day));
    return dateOnly;
};
exports.removeTimeFromDate = removeTimeFromDate;
const parseTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toString();
};
exports.parseTimestamp = parseTimestamp;

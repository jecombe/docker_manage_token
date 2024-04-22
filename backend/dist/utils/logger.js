"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerServer = void 0;
const log4js_1 = __importDefault(require("log4js"));
const logConfig = {
    appenders: {
        server: {
            type: "console",
            filename: "./logs/server.log",
            layout: { type: "pattern", pattern: "%[[%d] %5.5p -%] %m" },
        }
    },
    categories: {
        default: { appenders: ["server"], level: "all" },
    }
};
log4js_1.default.configure(logConfig);
exports.loggerServer = log4js_1.default.getLogger("server");

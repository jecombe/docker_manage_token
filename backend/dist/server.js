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
const Manager_js_1 = require("./srcs/Manager.js");
const logger_js_1 = require("./utils/logger.js");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        waiting: 2000,
        timeBlock: 14
    };
    const manager = new Manager_js_1.Manager(config);
    try {
        manager.startServer();
    }
    catch (error) {
        logger_js_1.loggerServer.error("Starting", error);
    }
}))();

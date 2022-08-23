"use strict";
// TYPES
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogger = exports.getLogger = void 0;
// FUNCTIONS
let logger = console;
function getLogger() {
    return logger;
}
exports.getLogger = getLogger;
function setLogger(newLogger) {
    logger = newLogger;
}
exports.setLogger = setLogger;

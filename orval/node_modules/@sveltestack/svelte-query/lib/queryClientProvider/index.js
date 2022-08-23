"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQueryClient = exports.QueryClientProvider = void 0;
var QueryClientProvider_svelte_1 = require("./QueryClientProvider.svelte");
Object.defineProperty(exports, "QueryClientProvider", { enumerable: true, get: function () { return __importDefault(QueryClientProvider_svelte_1).default; } });
var useQueryClient_1 = require("./useQueryClient");
Object.defineProperty(exports, "useQueryClient", { enumerable: true, get: function () { return __importDefault(useQueryClient_1).default; } });

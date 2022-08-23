"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const svelte_1 = require("svelte");
require("../queryCore/core/queryClient");
function useQueryClient() {
    const queryClient = svelte_1.getContext('queryClient');
    if (!queryClient) {
        throw new Error('No QueryClient set, use QueryClientProvider to set one');
    }
    return queryClient;
}
exports.default = useQueryClient;

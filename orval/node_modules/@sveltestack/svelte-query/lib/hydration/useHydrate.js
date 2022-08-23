"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queryClientProvider_1 = require("../queryClientProvider");
const hydration_1 = require("../queryCore/hydration");
function useHydrate(state, options) {
    const client = queryClientProvider_1.useQueryClient();
    if (state) {
        hydration_1.hydrate(client, state, options);
    }
}
exports.default = useHydrate;

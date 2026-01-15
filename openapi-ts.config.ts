import { defineConfig } from "@hey-api/openapi-ts";
import { defaultPlugins } from "@hey-api/openapi-ts";

export default defineConfig({
    input: "http://localhost:8000/docs/json",
    output: {
        path: "src/client",
        lint: "eslint",
        format: "prettier",
    },

    plugins: [
        ...defaultPlugins,
        {
            name: "@hey-api/client-next",
            runtimeConfigPath: "./src/init-openapi.ts",
        },
        // "zod",
        {
            asClass: true,
            operationId: true,
            name: "@hey-api/sdk",
            // validator: true,
        },
    ],
});

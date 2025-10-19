import * as Comlink from 'comlink';
import loadPipelineModule from './load-pipeline-module.js';
import runPipeline from './run-pipeline.js';
const workerOperations = {
    runPipeline: async function (pipelinePath, pipelineBaseUrl, args, outputs, inputs, pipelineQueryParams) {
        const pipelineModule = await loadPipelineModule(pipelinePath, pipelineBaseUrl, pipelineQueryParams);
        return await runPipeline(pipelineModule, args, outputs, inputs);
    }
};
Comlink.expose(workerOperations);
//# sourceMappingURL=itk-wasm-pipeline.worker.js.map
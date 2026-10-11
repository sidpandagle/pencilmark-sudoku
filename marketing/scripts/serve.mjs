// Preview server: http://127.0.0.1:4180/src/scenes/explainer.html?tech=x-wing&play   (Ctrl+C to stop)
import { serve } from './lib.mjs';
const { base } = await serve(Number(process.env.PORT || 4180));
console.log(`serving marketing/ on ${base}  e.g. ${base}/src/scenes/explainer.html?tech=x-wing&play`);

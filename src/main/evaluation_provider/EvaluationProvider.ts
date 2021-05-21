import { EvaluationResult } from "../evaluation_retriever/EvaluationResult";
import * as fs from 'fs';
import * as path from 'path';

import * as evaluationConfig from '../config/evaluationConfig.json';


export class EvaluationProvider {

    private readonly templateFolder = path.join(__dirname, '..', '..', '..', 'template');
    private evaluationTemplate: string;

    constructor() {
        this.evaluationTemplate = this.loadEvaluationTemplate();
    }

    provideEvaluation(evaluationResult: EvaluationResult): string {
        var evaluation = this.evaluationTemplate;
        for (var key in evaluationResult) {
            evaluation = evaluation.replace(new RegExp(`\\$${key}\\$`, "gm"), String(evaluationResult[key]));
        }
        return evaluation;
    }

    private loadEvaluationTemplate(): string {
        return fs.readFileSync(path.join(this.templateFolder, evaluationConfig.evaluationTemplateFileName)).toString();
    }
}
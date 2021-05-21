import { EvaluationResult } from "./EvaluationResult";
import { EvaluationTable } from "./EvaluationTable";


export class EvaluationRetriever {

    public static readonly TOTAL_POINTS_ID = "Total";


    retrieveEvaluationResult(evaluationFileContent: string): EvaluationResult {
        let evaluationTables = this.parseEvaluationTables(evaluationFileContent);
        let evaluationResult = this.summarizeTablePoints(evaluationTables);
        this.summarizePointsPerExercise(evaluationResult);
        return evaluationResult;
    }

    private summarizeTablePoints(evaluationTables: EvaluationTable[]): EvaluationResult {
        let evaluationResult: EvaluationResult = {};

        for (let evaluationTable of evaluationTables) {
            this.addPointsToEvaluationResult(evaluationResult, evaluationTable.getExerciseId(), evaluationTable.getPointsSum());
        }

        this.calculateTotalPoints(evaluationResult);
        return evaluationResult;
    }

    private summarizePointsPerExercise(evaluationResult: EvaluationResult) {
        for (var key in evaluationResult) {
            let exerciseKeyResult = key.match(/\d+/);
            if (exerciseKeyResult) {
                let exerciseKey = exerciseKeyResult[0];
                if (evaluationResult[exerciseKey]) {
                    evaluationResult[exerciseKey] = evaluationResult[exerciseKey] + evaluationResult[key];
                } else {
                    evaluationResult[exerciseKey] = evaluationResult[key];
                }
            }
        }
    }

    private calculateTotalPoints(evaluationResult: EvaluationResult) {
        let totalPoints = 0;

        for (let key in evaluationResult) {
            totalPoints += evaluationResult[key];
        }

        evaluationResult[EvaluationRetriever.TOTAL_POINTS_ID] = totalPoints;
    }

    private addPointsToEvaluationResult(evaluationResult: EvaluationResult, exerciseId: string, points: number) {
        let existingPoints = 0;
        if (evaluationResult[exerciseId]) {
            existingPoints = evaluationResult[exerciseId];
        }
        evaluationResult[exerciseId] = existingPoints + points;
    }

    private parseEvaluationTables(evaluationFileContent: string): EvaluationTable[] {
        let evaluationTables: EvaluationTable[] = [];
        let contentLines: string[] = [];

        for (const line of evaluationFileContent.split(/[\r\n]+/)){
            if (line.includes(EvaluationTable.SEPARATOR)) {
                contentLines.push(line);
            } else {
                if (this.parseEvaluationTable(evaluationTables, contentLines)) {
                    contentLines = [];
                }
            }
        }

        this.parseEvaluationTable(evaluationTables, contentLines);

        return evaluationTables;
    }

    private parseEvaluationTable(evaluationTables: EvaluationTable[], contentLines: string[]): boolean {
        if (contentLines.length > 0) {
            let newEvaluationTable = new EvaluationTable(contentLines);
            evaluationTables.push(newEvaluationTable);
            
            return true;
        } else {
            return false;
        }
    }
}
import * as evaluationConfig from '../config/evaluationConfig.json';

export class EvaluationTable {

    public static readonly SEPARATOR = "|";
    public static readonly RELEVANT_COLUMN_INDEX = evaluationConfig.relevantTableIndex;

    private exerciseId: string;
    private points: number[];

    constructor(contentLines: string[]) {
        if (contentLines.length < 3) {
            throw Error("Tables must at least contain three lines");
        }

        this.exerciseId = this.parseExerciseId(contentLines.shift()!);
        contentLines.shift();
        this.points = this.parseTablePoints(contentLines);
    }

    private parseExerciseId(firstLine: string): string {
        return this.getRelevantColumnValue(firstLine);
    }

    private parseTablePoints(pointLines: string[]): number[] {
        let points: number[] = [];

        for (let pointLine of pointLines) {
            let value = this.getRelevantColumnValue(pointLine);
            value = this.translatePoints(value);
            let newPointNumber = Number(value);
            if (Number.isNaN(newPointNumber)) {
                throw Error(`Invalid point count in table for exercise: ${this.exerciseId}. Value was: ${value}`);
            }
            points.push(newPointNumber);
        }

        return points;
    }

    private translatePoints(value: string): string {
        let translation: { [id: string]: string | number } = evaluationConfig.pointTranslation;
        for (let key in translation) {
            if (key == value) {
                return String(translation[key]);
            }
        }
        return value;
    }

    private getRelevantColumnValue(row: string): string {
        let columns = row.trim().split(EvaluationTable.SEPARATOR);
        columns.shift();

        if (columns.length < EvaluationTable.RELEVANT_COLUMN_INDEX + 1) {
            throw Error(`Tables must at least contain ${EvaluationTable.RELEVANT_COLUMN_INDEX + 2} |`);
        }

        return columns[EvaluationTable.RELEVANT_COLUMN_INDEX].trim();
    }

    public getExerciseId(): string {
        return this.exerciseId;
    }

    public getPointsSum(): number {
        let sum = 0;

        for (let point of this.points) {
            sum += point;
        }

        return sum;
    }
}
import { RepositoryManager } from "./RepositoryManager";
import dotenv from "dotenv";
import { Gitlab, ProjectSchema } from "gitlab";

import * as evaluationConfig from '../config/evaluationConfig.json';
import { EvaluationResult } from "../evaluation_retriever/EvaluationResult";
import { EvaluationRetriever } from "../evaluation_retriever/EvaluationRetriever";
import { EvaluationProvider } from "../evaluation_provider/EvaluationProvider";

dotenv.config();
const gitlab = new Gitlab({
    host: process.env.HOST,
    token: process.env.API_TOKEN,
});


export class GitlabRepositoryManager implements RepositoryManager {
    
    private evaluationRetriever: EvaluationRetriever = new EvaluationRetriever();
    private evaluationProvider: EvaluationProvider = new EvaluationProvider();


    async processEvaluations(): Promise<void> {
        let projects = await this.getAllProjectsInGroup(evaluationConfig.evaluationFolderId);

        console.log("Start processing evaluations");
        for (let project of projects) {
            try {
                await this.processEvaluationForProject(project);
            } catch (error) {
                console.log(`Error processing project: ${project.web_url}`);
                console.log(error);   
            }
        }
        console.log("Finished processing evaluations");
    }
    
    async processEvaluationForProject(project: ProjectSchema): Promise<void> {
        let evaluationResult = await this.getEvaluationResult(project);
        if (evaluationResult && !evaluationConfig.testRun) {
            let evaluation = this.evaluationProvider.provideEvaluation(evaluationResult);
            await this.provideEvaluation(project, evaluation);
            console.log(`Provided evaluation for project: ${project.web_url}`);
        }
    }

    async getEvaluationResult(project: ProjectSchema): Promise<EvaluationResult | undefined> {
        let testRepoId = await this.getTestRepoId(project.id);
        let evaluateFileContent;

        try {
            evaluateFileContent = String(await gitlab.RepositoryFiles.showRaw(testRepoId, evaluationConfig.evaluationSourceFilePath, "master"));
        } catch (error) {
            console.log(`Could not retrieve evaluation result from project: ${project.web_url}`);
            return undefined;
        }

        return this.evaluationRetriever.retrieveEvaluationResult(evaluateFileContent);
    }

    private async getAllProjectsInGroup(groupId: number): Promise<ProjectSchema[]> {
        return gitlab.GroupProjects.all(groupId);
    }

    private async getTestRepoId(projectId: number): Promise<number> {
        let testRepoLinkSchema = await gitlab.ProjectVariables.show(projectId, 'TEST_REPO_TRIGGER_URL');
        let testRepoLink = testRepoLinkSchema.value;

        let linkParts = testRepoLink.split("/");
        let number = Number.parseInt(linkParts[linkParts.length - 3]);
        return number;
    }

    private async provideEvaluation(project: ProjectSchema, evaluation: string) {
        let commitActions: any[] = [{ action: 'update', filePath: evaluationConfig.evaluationTargetFilePath, content: evaluation }];
        await gitlab.Commits.create(project.id, "master", "update evaluation", commitActions);
    }
}
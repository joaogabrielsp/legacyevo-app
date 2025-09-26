import { Project, NewProjectData } from '../types';
import { readTextFile, writeTextFile, exists, create } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

const PROJECTS_FILE = 'projects.json';

class ProjectService {
  private async getProjectsFilePath(): Promise<string> {
    const appDir = await appDataDir();
    return await join(appDir, PROJECTS_FILE);
  }

  private async ensureAppDataDir(): Promise<void> {
    try {
      const appDir = await appDataDir();
      const dirExists = await exists(appDir);
      if (!dirExists) {
        await create(appDir);
      }
    } catch (error) {
      console.error('Error ensuring app data directory:', error);
    }
  }

  async loadProjects(): Promise<Project[]> {
    try {
      await this.ensureAppDataDir();
      const filePath = await this.getProjectsFilePath();

      const fileExists = await exists(filePath);
      if (!fileExists) {
        return [];
      }

      try {
        const content = await readTextFile(filePath);
        const projects = JSON.parse(content);

        if (!Array.isArray(projects)) {
          console.warn('Projects file is not in expected format, returning empty array');
          return [];
        }

        return projects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
      } catch (parseError) {
        console.warn('Error parsing projects file, returning empty array:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  async saveProject(projectData: NewProjectData): Promise<Project> {
    try {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: projectData.name,
        type: projectData.type,
        legacyPath: projectData.legacyPath,
        newPath: projectData.newPath,
        createdAt: new Date()
      };

      const existingProjects = await this.loadProjects();
      const updatedProjects = [...existingProjects, newProject];

      await this.saveProjectsToFile(updatedProjects);

      return newProject;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  async saveProjectsToFile(projects: Project[]): Promise<void> {
    try {
      await this.ensureAppDataDir();
      const filePath = await this.getProjectsFilePath();
      const content = JSON.stringify(projects, null, 2);
      await writeTextFile(filePath, content);
    } catch (error) {
      console.error('Error saving projects to file:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const existingProjects = await this.loadProjects();
      const updatedProjects = existingProjects.filter(project => project.id !== id);
      await this.saveProjectsToFile(updatedProjects);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async updateProject(updatedProject: Project): Promise<void> {
    try {
      const existingProjects = await this.loadProjects();
      const updatedProjects = existingProjects.map(project =>
        project.id === updatedProject.id ? updatedProject : project
      );
      await this.saveProjectsToFile(updatedProjects);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }
}

export default new ProjectService();
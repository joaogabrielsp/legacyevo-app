export interface TestCase {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "passed" | "failed"
  legacyOutput?: string
  newOutput?: string
  executionTime?: number
}

export interface Project{
    id: string
    name: string
    type: ProjectType
    legacyPath?: string
    newPath?: string
    lastOpened?: Date
}

export interface NewProjectData {
  name: string;
  legacyPath: string;
  newPath: string;
  type: ProjectType;
}

export type Screen = "home" | "work-space"

export type ProjectType = 'API' | 'Web' | 'Terminal';
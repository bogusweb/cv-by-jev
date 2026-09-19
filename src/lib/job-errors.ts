export class JobFetchError extends Error {
  code: "JOB_FETCH" | "JOB_EMPTY";

  constructor(message: string, code: "JOB_FETCH" | "JOB_EMPTY") {
    super(message);
    this.name = "JobFetchError";
    this.code = code;
  }
}

export interface JobDocument {
  url: string;
  title?: string;
  text: string;
}

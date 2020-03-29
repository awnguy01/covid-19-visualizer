export interface GitHubFileInfoObject {
  name: string;
  path: string;
  sha: string;
  size: string;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

// import function for use!!!
import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3); // first 3 projects

const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h3');

// gain github info
const githubData = await fetchGithubData('Zeng-xinyi');
// github home page
const profileStats = document.querySelector('#profile-stats');
// show info
if (githubData) {
  profileStats.innerHTML = `
    <img src="${githubData.avatar_url}" alt="GitHub avatar" width="100">
    <h3><a href="${githubData.html_url}" target="_blank">@${githubData.login}</a></h3>
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}

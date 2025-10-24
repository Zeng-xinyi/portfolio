// import function for use!!!
import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3); // first 3 projects

const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h3');

// gain github info
const githubData = await fetchGithubData('Zeng-xinyi');
// github home page
const githubContainer = document.querySelector('.github-info');
// show info
if (githubData) {
  githubContainer.innerHTML = `
    <img src="${githubData.avatar_url}" alt="GitHub avatar" width="100">
    <p><a href="${githubData.html_url}" target="_blank">@${githubData.login}</a></p>
    <p>Followers: ${githubData.followers}</p>
    <p>Following: ${githubData.following}</p>
    <p>Public Repos: ${githubData.public_repos}</p>
  `;
}
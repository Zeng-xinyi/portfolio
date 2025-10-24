import { fetchJSON, renderProjects } from '../global.js';

//await: only run in module environment; namely "<script type="module">"
const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  const count = projects.length;
  titleElement.textContent = `${count} Projects`;
}
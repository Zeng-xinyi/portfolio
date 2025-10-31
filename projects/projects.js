import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


//await: only run in module environment; namely "<script type="module">"
const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  const count = projects.length;
  titleElement.textContent = `${count} Projects`;
}

// lab5 step 1.3: Draw a full circle with D3
// Select the existing <svg> (lab5 step 1.1)
const svg = d3.select('#projects-pie-plot');

// defines how the path should look
const arcGenerator = d3.arc()
  .innerRadius(0)   
  .outerRadius(50); 

// Generate one full circle: 0 -> 2pai
const arcPath = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI
});

// Append the path to SVG
svg.append('path')
  .attr('d', arcPath)
  .attr('fill', 'red');
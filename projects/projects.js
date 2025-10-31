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

// // lab5 step 1.3: Draw a full circle with D3
// // Select the existing <svg> (lab5 step 1.1)
// const svg = d3.select('#projects-pie-plot');
// 
// defines how the path should look
// const arcGenerator = d3.arc()
//   .innerRadius(0)   
//   .outerRadius(50); 
// 
// // Generate one full circle: 0 -> 2pai
// const arcPath = arcGenerator({
//   startAngle: 0,
//   endAngle: 2 * Math.PI
// });
// 
// // Append the path to SVG
// svg.append('path')
//   .attr('d', arcPath)
//   .attr('fill', 'red');

// Draw a static pie chart with D3
const svg = d3.select('#projects-pie-plot');
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const sliceGenerator = d3.pie().value(d => d.value);

// Group projects by year and count
let rolledData = d3.rollups(
  projects,        
  (v) => v.length, 
  (d) => d.year    
);

// Convert to array of objects with {value, label}
let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

const arcData = sliceGenerator(data);
const colors = d3.scaleOrdinal(d3.schemeTableau10);

arcData.forEach((d, idx) => {
  svg.append('path')
    .attr('d', arcGenerator(d))
    .attr('fill', colors(idx))
    .attr('stroke', 'white')
    .attr('stroke-width', 0.5);
});








// avoid repeating rendering
d3.select('.legend').html('');

const legend = d3.select('.legend');

data.forEach((d, idx) => {
  legend.append('li')
    .attr('class', 'legend-item')
    .attr('style', `--color: ${colors(idx)}`)
    .html(`<span class="swatch" aria-hidden="true"></span> ${d.label} <em>(${d.value})</em>`);
});
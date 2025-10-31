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
// const svg = d3.select('#projects-pie-plot');
// const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
// const sliceGenerator = d3.pie().value(d => d.value);
// 
// // Group projects by year and count
// let rolledData = d3.rollups(
//   projects,        
//   (v) => v.length, 
//   (d) => d.year    
// );
// 
// // Convert to array of objects with {value, label}
// let data = rolledData.map(([year, count]) => {
//   return { value: count, label: year };
// });
// 
// const arcData = sliceGenerator(data);
// const colors = d3.scaleOrdinal(d3.schemeTableau10);
// 
// arcData.forEach((d, idx) => {
//   svg.append('path')
//     .attr('d', arcGenerator(d))
//     .attr('fill', colors(idx))
//     .attr('stroke', 'white')
//     .attr('stroke-width', 0.5);
// });
// 
// 
// // avoid repeating rendering
// d3.select('.legend').html('');
// 
// const legend = d3.select('.legend');
// 
// data.forEach((d, idx) => {
//   legend.append('li')
//     .attr('class', 'legend-item')
//     .attr('style', `--color: ${colors(idx)}`)
//     .html(`<span class="swatch" aria-hidden="true"></span> ${d.label} <em>(${d.value})</em>`);
// });

let selectedIndex = -1; // 默认没有选中任何 wedge

function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  // 清空旧图表和图例
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  // === 计算数据 ===
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  // === 配置 D3 ===
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  let pie = d3.pie().value((d) => d.value);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let arcs = pie(data);

  // === 绘制饼图 ===
  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arcGenerator(arc))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .attr('data-index', i)
      .on('click', () => {
        // 点击切换选中状态
        selectedIndex = selectedIndex === i ? -1 : i;

        // 更新所有扇形样式
        svg.selectAll('path').attr('class', (_, idx) =>
          idx === selectedIndex ? 'selected' : ''
        );

        // 更新所有 legend 样式
        legend.selectAll('li').attr('class', (_, idx) =>
          idx === selectedIndex ? 'legend-item selected' : 'legend-item'
        );
      });
  });

  // === 绘制图例 ===
  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// add search functionality 
let query = '';
const searchInput = document.querySelector('.searchBar');
renderPieChart(projects);

// input: Triggered every time the user enters or deletes a character (in real time).
searchInput.addEventListener('input', (event) => {
  query = event.target.value.trim().toLowerCase();

  let filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(query)
  );

  renderProjects(filteredProjects, projectsContainer, 'h2');

  if (titleElement) {
    titleElement.textContent = `${filteredProjects.length} Projects`;
  }

  renderPieChart(filteredProjects);
});

console.log('Interactive pie chart with search ready!');
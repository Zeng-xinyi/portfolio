// import D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,     
    depth: +row.depth,   
    length: +row.length, 
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

//const data = await loadData();
//console.log(data); // show data at console

// await loadData(); // load but not print

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit) // grouped by commit
    .map(([commit, lines]) => {
      const first = lines[0]; // column name
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        url: 'https://github.com/Zeng-xinyi/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        // calculate time
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        // the code changed in commit 
        totalLines: lines.length,
      };

      // save "lines" object but not show off in the console
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,   
        writable: false,     
        configurable: false, 
      });

      return ret;
    });
}

const data = await loadData();
const commits = processCommits(data);

console.log(commits);

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  //number of files
  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.groups(data, (d) => d.file).length);

  //average depth
  dl.append('dt').text('Average depth');
  dl.append('dd').text(d3.mean(data, (d) => d.depth).toFixed(2));

  //maximum depth
  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(d3.max(data, (d) => d.depth));
}

renderCommitInfo(data, commits);

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (!commit || Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id.slice(0, 7); 
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const offset = 15;
  tooltip.style.left = `${event.clientX + offset}px`;
  tooltip.style.top = `${event.clientY + offset}px`;
}



// commit by the time of the day
function renderScatterPlot(data, commits) {
  //scale
  const width = 1000;
  const height = 600;
  //margin
  const margin = { top: 10, right: 10, bottom: 30, left: 50 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  //create svg
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');


  //X: date
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  // Y: hour of the day
  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // add grid
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);


  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('') // no text
      .tickSize(-usableArea.width) // through all plot
  );
  gridlines.selectAll('line')
  .attr('stroke', (d) => {// set colour to distinguish day and night
    const h = d; // hour
    return h >= 6 && h <= 18 ? '#e87427ff' : '#29277eff'; 
  })
  .attr('stroke-opacity', 0.2);

  // add scatter plot
  const dots = svg.append('g').attr('class', 'dots');

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
  .scaleLinear()
  .domain([minLines, maxLines])
  .range([4, 25]); //3px, 25px

  dots
  .selectAll('circle')
  .data(commits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.totalLines))
  .attr('fill', 'steelblue')
  .style('fill-opacity', 0.7)
  .on('mouseenter', (event, commit) => {
    d3.select(event.currentTarget).style('fill-opacity', 1); // highlight when hover
    renderTooltipContent(commit);
    updateTooltipVisibility(true); // show tooltip
    updateTooltipPosition(event);
  })
  .on('mousemove', (event) => {
    updateTooltipPosition(event);
  })
  .on('mouseleave', () => {
    d3.select(event.currentTarget).style('fill-opacity', 0.7); 
    updateTooltipVisibility(false); // hide tooltip
  });


  // add axis
  const xAxis = d3.axisBottom(xScale);

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
}

renderScatterPlot(data, commits);




// import D3
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';


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

// update commit: npx elocuent -d . -o meta/loc.csv --spaces 2
const data = await loadData();
const commits = processCommits(data).sort((a, b) => a.datetime - b.datetime);
let filteredCommits = commits; 

let commitProgress = 100; // slider value 0-100
let timeScale;            // converts datetime <-> % progress
let commitMaxTime;        // the actual datetime cutoff
let xScale, yScale;
let colors = d3.scaleOrdinal(d3.schemeTableau10);


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

// --- Build time scale ---
timeScale = d3.scaleTime()
  .domain([
    d3.min(commits, d => d.datetime),
    d3.max(commits, d => d.datetime)
  ])
  .range([0, 100]);

commitMaxTime = timeScale.invert(commitProgress);


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

  const tooltipRect = tooltip.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let left = event.clientX + offset;
  let top = event.clientY + offset;

  if (left + tooltipRect.width > windowWidth) {
    left = event.clientX - tooltipRect.width - offset;
  }

  if (top + tooltipRect.height > windowHeight) {
    top = event.clientY - tooltipRect.height - offset;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

document.getElementById("commit-progress")
  .addEventListener("input", onTimeSliderChange);

onTimeSliderChange(); 



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
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  // Y: hour of the day
  yScale = d3
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
  const rScale = d3.scaleSqrt()
  .domain([minLines, maxLines])
  .range([3, 25]); //5px, 20px

  //let small points above the big points
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines); 

  dots
  .selectAll('circle')
  .data(commits, d => d.id)   // reuse the circle
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.totalLines))
  .attr('fill', 'steelblue')
  .style('fill-opacity', 0.7)
  .on('mouseenter', (event, commit) => {
    d3.select(event.currentTarget)
      .transition()
      .duration(150)
      .attr('r', (d) => rScale(d.totalLines) * 1.1) 
      .style('fill-opacity', 1);// highlight when hover
    renderTooltipContent(commit);
    updateTooltipVisibility(true); // show tooltip
    updateTooltipPosition(event);
  })
  .on('mousemove', (event) => {
    updateTooltipPosition(event);
  })
  .on('mouseleave', () => {
    d3.select(event.currentTarget)
      .transition()
      .duration(150)
      .attr('r', (d) => rScale(d.totalLines))
      .style('fill-opacity', 0.7);
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
    .attr('class', 'x-axis') //redraw
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

  //brushing
  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);

    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );

    container.innerHTML = '';

    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);

      container.innerHTML += `
        <dt>${language}</dt>
        <dd>${count} lines (${formatted})</dd>
      `;
    }
  }



  function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle')
      .classed('selected', (d) => isCommitSelected(selection, d));
    
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }

  const brush = d3.brush()
    .on('start brush end', brushed);

  svg.call(brush);

  // Position the scatter points above the brush rectangle
  svg.select('.dots').raise();
}

renderScatterPlot(data, commits);

function onTimeSliderChange() {
  const slider = document.getElementById("commit-progress");
  commitProgress = +slider.value;


  commitMaxTime = timeScale.invert(commitProgress);

  const timeElem = document.getElementById("commit-time");
  timeElem.textContent = commitMaxTime.toLocaleString("en", {
    dateStyle: "long",
    timeStyle: "short"
  });
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  updateScatterPlot();
  updateSummaryDisplay(filteredCommits);
  updateFileDisplay(filteredCommits);
}

function updateScatterPlot() {
  const svg = d3.select("#chart").select("svg");
  if (svg.empty()) return;

  xScale.domain(d3.extent(filteredCommits, d => d.datetime));

  const xAxis = d3.axisBottom(xScale);
  const xAxisGroup = svg.select("g.x-axis");
  xAxisGroup.selectAll("*").remove();  
  xAxisGroup.call(xAxis);

  const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([3, 25]);

  const dots = svg.select("g.dots");

  dots
    .selectAll("circle")
    .data(filteredCommits, d => d.id) // reuse circles
    .join(
      enter => enter
        .append("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.totalLines))
        .attr("fill", "steelblue")
        .style("fill-opacity", 0.7)
        .on('mouseenter', (event, commit) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(150)
            .attr("r", d => rScale(d.totalLines) * 1.1)
            .style("fill-opacity", 1);
          renderTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mousemove', (event) => updateTooltipPosition(event))
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(150)
            .attr("r", d => rScale(d.totalLines))
            .style("fill-opacity", 0.7);
          updateTooltipVisibility(false);
        }),

      update => update
        .transition()
        .duration(300)
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.totalLines)),

      exit => exit
        .transition()
        .duration(200)
        .style("opacity", 0)
        .remove()
    );
}


function updateSummaryDisplay(filteredCommits) {

  const filteredLines = filteredCommits.flatMap(d => d.lines);

  const dl = d3.select('#stats dl');

  // update Total LOC
  dl.select(":nth-child(2)").text(filteredLines.length);

  // update Total commits
  dl.select(":nth-child(4)").text(filteredCommits.length);

  // update Number of files
  dl.select(":nth-child(6)").text(
    d3.groups(filteredLines, d => d.file).length
  );

  // update Average depth
  dl.select(":nth-child(8)").text(
    d3.mean(filteredLines, d => d.depth).toFixed(2)
  );

  // update Maximum depth
  dl.select(":nth-child(10)").text(
    d3.max(filteredLines, d => d.depth)
  );
}

function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap(d => d.lines);

  let files = d3.groups(lines, d => d.file).map(([name, lines]) => ({
    name,
    lines
  })).sort((a, b) => b.lines.length - a.lines.length);// sort lines

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, d => d.name)
    .join(
      enter =>
        enter.append('div').call(div => {
          div.append('dt').append('code');
          div.append('dd');
        })
    );

  filesContainer
    .select('dt > code')
    .html(d => `${d.name}<br><small>${d.lines.length} lines</small>`);

  filesContainer
    .select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`); ;
}

// ----------- Step 3.2: Generate commit scrolly text ------------
d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
      <p>
        On ${d.datetime.toLocaleString('en', {
          dateStyle: 'full',
          timeStyle: 'short',
        })},
        I made
        <a href="${d.url}" target="_blank">
          ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
        </a>.
        I edited ${d.totalLines} lines across ${
          d3.rollups(
            d.lines,
            (D) => D.length,
            (d) => d.file,
          ).length
        } files.
      </p>
    `
  );

// -------------------- Step 3.3: Scrollama -----------------------

function onStepEnter(response) {
  // 取得当前 step 对应的 commit 数据
  const commit = response.element.__data__;
  const targetTime = commit.datetime;

  // 让 slider 跟随滚动移动（可选，但体验更好）
  const percent = timeScale(targetTime);
  commitProgress = percent;
  document.getElementById('commit-progress').value = percent;
  document.getElementById('commit-time').textContent =
    targetTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

  // 和 slider 一样生成 filteredCommits
  filteredCommits = commits.filter((d) => d.datetime <= targetTime);

  // 更新 Summary（你的 1.2 已完成）
  updateSummaryDisplay(filteredCommits);

  // 更新 scatter plot
  updateScatterPlot();

  // 更新文件可视化（Step 2.1）
  updateFileDisplay(filteredCommits);
}

const scroller = scrollama();

scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
    offset: 0.5, // 当 step 元素进入屏幕中线 (=50%) 时触发
  })
  .onStepEnter(onStepEnter);

// 窗口改变大小时重新计算 Scrollama
window.addEventListener('resize', scroller.resize);



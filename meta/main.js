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

      // 用隐藏属性保存原始行数据（不在控制台直接打印出来）
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,   // 不在 console.log 中显示
        writable: false,     // 不允许修改
        configurable: false, // 不允许删除
      });

      return ret;
    });
}

const data = await loadData();
const commits = processCommits(data);

console.log(commits);

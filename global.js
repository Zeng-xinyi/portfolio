console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'CV' },
  { url: 'contact/', title: 'Contact' },
  { url: 'meta/', title: 'Meta' },
  { url: 'https://github.com/Zeng-xinyi', title: 'GitHub' }
];

// Determine base path for links
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/"; 

let nav = document.createElement('nav');
document.body.prepend(nav);


for (let p of pages) {
  let url = p.url;
  let title = p.title;

  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  //directly create DOM object, avoid transforming mistakes.
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // highlight current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in new tab
  if (a.host !== location.host) {
    a.target = '_blank';
    a.rel = 'noopener'; // prevent the new page from accessing window.opener
  }

  nav.append(a);
}

// Add dark mode switch
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
		</select>
	</label>`,
);

//make the switch work
// reserve the mode when changing the page
const select = document.querySelector('.color-scheme select');

// load localStorage's theme（if existed）
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.style.colorScheme = savedTheme;
  select.value = savedTheme;
}

// when shifting the page，save the mode in localStorage
select.addEventListener('change', (event) => {
  const theme = event.target.value;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem('theme', theme); 
});

const form = document.querySelector('form');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  let url = form.action + '?';
  const params = [];
  for (let [name, value] of data) {
    if (value.trim() !== '') {
      params.push(`${name}=${encodeURIComponent(value)}`);
    }
  }
  url += params.join('&');
  location.href = url;
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    
    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    throw error; // show what error it is
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  //projects: array, whose object is { title, image, description, ... }, referring to an article
  //containerElement: DOM container

  //check object: position error
  if (!containerElement || !(containerElement instanceof Element)) {
    console.error('renderProjects: containerElement is not a DOM element');
    return;
  }
  if (!Array.isArray(projects)) {
    console.error('renderProjects: projects must be an array');
    return;
  }
  // headingLevel: 'h1' 'h2' 'h3' … 'h6'
  if (!/^h[1-6]$/.test(headingLevel)) {
    console.warn(`renderProjects: invalid headingLevel "${headingLevel}", using "h2".`);
    headingLevel = 'h2';
  }

  //let container like <div class="projects"> empty
  containerElement.innerHTML = '';
  // note when there is no project
  if (projects.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No projects available.';
    containerElement.appendChild(p);
    return;
  }

  const fragment = document.createDocumentFragment();
  // iterate projects
  for (const project of projects) {
    const article = document.createElement('article');
    //set title
    const titleText = project.title || 'Untitled Project';
    const imgSrc = project.image || '../images/placeholder.png';
    const descText = project.description || '';

    const heading = document.createElement(headingLevel);
    heading.textContent = titleText;
    //parentNode.appendChild(childNode);
    //Add a node as the last child of another node
    article.appendChild(heading);

    // image
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = titleText;
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      img.src = '../images/placeholder.png';
    });
    article.appendChild(img);

    // <p> for text
    // change as below
    //<div>
    //<p>描述</p>
    //<p class="project-year">2024</p>
    //</div>
    const textWrapper = document.createElement('div');

    const p = document.createElement('p');
    p.textContent = descText;
    textWrapper.appendChild(p);

    if (project.year) {
      const year = document.createElement('p');
      year.textContent = project.year;
      year.classList.add('project-year');
      textWrapper.appendChild(year);
    }

    article.appendChild(textWrapper);

    fragment.appendChild(article);
  }

  containerElement.appendChild(fragment);
}

// show github information
export async function fetchGithubData(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);

    if (!response.ok) {
      throw new Error(`GitHub user not found: ${username}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return null; 
  }
}



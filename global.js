console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'CV' },
  { url: 'contact/', title: 'Contact' },
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
const input = document.querySelector('input');
const btn = document.querySelector('#search-button');
const bookContainer = document.querySelector('.books-container');
const loader = document.querySelector('.loader');
const favoritesBooks = document.querySelector('.favorite-books');
const authorSelect = document.querySelector('#author-select');
const themeToggle = document.querySelector('#theme-toggle');

let allBooks = [];

const searchQuery = 'https://openlibrary.org/search.json?q=';

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const current =
    document.documentElement.getAttribute('data-theme') || 'light';

  const newTheme = current === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// debouce func, delay 400 to wait for the full value to be entered

function debounce(fn, delay = 400) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// search books func, get text query and make async request to API

async function searchBooks(text) {
  if (text.length < 3) {
    bookContainer.innerHTML = '';
    return;
  }

  loader.style.display = 'block';

  try {
    const response = await fetch(searchQuery + text);

    if (!response.ok) throw new Error('Ошибка сети');

    const data = await response.json();
    allBooks = data.docs;

    renderBooks(allBooks);
  } catch (error) {
    console.error(error);
  } finally {
    loader.style.display = 'none';
  }
}

// debounce in search

const debouncedSearch = debounce((value) => {
  searchBooks(value);
}, 500);

input.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  debouncedSearch(value);
});

btn.addEventListener('click', () => {
  const text = input.value.trim();
  searchBooks(text);
});

// creating books card func

function renderBooks(books) {
  bookContainer.innerHTML = '';

  if (!books || books.length === 0) {
    const empty = document.createElement('h1');
    empty.textContent = 'По вашему запросу ничего не найдено =(';
    bookContainer.append(empty);
    return;
  }

  books.forEach((book) => {
    if (!book.cover_i) return;

    const card = document.createElement('div');
    card.classList.add('book-card');

    const img = document.createElement('img');
    img.src = `https://covers.openlibrary.org/b/id/${book.cover_i}.jpg`;

    const title = document.createElement('h2');
    title.textContent = book.title;

    const author = document.createElement('p');
    author.classList.add('author');
    author.textContent = book.author_name
      ? book.author_name[0]
      : 'Unknown author';

    const year = document.createElement('p');
    year.textContent = book.first_publish_year || 'Unknown year';

    const button = document.createElement('button');
    button.textContent = '❤️';
    button.classList.add('like-btn');

    button.addEventListener('click', () => {
      addToFavorites(book.title, book.cover_i);
    });

    card.append(img, title, author, year, button);
    bookContainer.appendChild(card);
  });

  buildAuthorFilterFromDOM();
}

// filter unique authors func, set collection

function buildAuthorFilterFromDOM() {
  authorSelect.innerHTML = '<option value="all">Все авторы</option>';

  const authors = new Set();

  document.querySelectorAll('.book-card').forEach((card) => {
    const author = card.querySelector('.author').textContent;
    if (author) authors.add(author);
  });

  [...authors]
    .sort((a, b) => a.localeCompare(b))
    .forEach((author) => {
      const option = document.createElement('option');
      option.value = author;
      option.textContent = author;
      authorSelect.append(option);
    });
}

authorSelect.addEventListener('change', (e) => {
  const selected = e.target.value;

  document.querySelectorAll('.book-card').forEach((card) => {
    const author = card.querySelector('.author').textContent;

    card.style.display =
      selected === 'all' || author === selected ? 'flex' : 'none';
  });
});

// save to localStorage func from DOM

function saveToLocalStorage() {
  const favs = [];
  favoritesBooks
    .querySelectorAll('.fav-item:not(.empty-msg)')
    .forEach((item) => {
      favs.push({
        title: item.querySelector('p').textContent,
        coverId: item.dataset.coverId,
      });
    });
  localStorage.setItem('my_fav_books', JSON.stringify(favs));
}

// load books from the localStorage

function loadFromLocalStorage() {
  const saved = localStorage.getItem('my_fav_books');
  if (saved) {
    const favs = JSON.parse(saved);
    favs.forEach((book) => {
      createFavoriteItem(book.title, book.coverId);
    });
  }
  checkEmptyFavorites();
}

// creating book card for add to favorites list

function createFavoriteItem(title, coverId) {
  const favItem = document.createElement('div');
  favItem.classList.add('fav-item');
  favItem.dataset.coverId = coverId;

  const img = document.createElement('img');
  img.src = `https://covers.openlibrary.org/b/id/${coverId}.jpg`;

  const titleItem = document.createElement('p');
  titleItem.textContent = title;

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '✕';
  removeBtn.classList.add('remove-fav');

  removeBtn.addEventListener('click', () => {
    favItem.remove();
    saveToLocalStorage();
    checkEmptyFavorites();
  });

  favItem.append(img, titleItem, removeBtn);
  favoritesBooks.appendChild(favItem);
}

// checking favorites list to empty for show "empty" interface

function checkEmptyFavorites() {
  const items = favoritesBooks.querySelectorAll('.fav-item:not(.empty-msg)');
  const existingMsg = favoritesBooks.querySelector('.empty-msg');

  if (items.length === 0) {
    if (!existingMsg) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'fav-item empty-msg';
      const p = document.createElement('p');
      p.textContent = 'Тут пока пусто';
      emptyMsg.append(p);
      favoritesBooks.appendChild(emptyMsg);
    }
  } else {
    if (existingMsg) existingMsg.remove();
  }
}

// func adding fav book card to favorites list and checking books for dublicates

function addToFavorites(title, coverId) {
  const existingFavs = Array.from(
    favoritesBooks.querySelectorAll('.fav-item:not(.empty-msg) p')
  );

  if (existingFavs.some((fav) => fav.textContent === title)) {
    alert('Книга уже в избранном!');
    return;
  }

  createFavoriteItem(title, coverId);
  saveToLocalStorage();
  checkEmptyFavorites();
}

loadFromLocalStorage();

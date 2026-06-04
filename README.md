# 💻 Bilgrandov's Tech Corner

A retro Windows XP-inspired interactive portfolio designed and developed from scratch by **Bilgrandov**. This project demonstrates a strong foundation in Front-End engineering, dynamic DOM manipulation, and modern web data architectures without relying on heavy UI frameworks.

## 🌟 Key Features
- **Retro Windows XP UI/UX**: Authentic taskbar, draggable-style windows, and CRT monitor visual effects.
- **Dynamic File Explorer**: The Projects and Posts pages use asynchronous JavaScript to fetch and render data from local JSON/Markdown databases dynamically.
- **Client-Side PDF Generation**: Projects can be exported to a beautifully formatted, landscape presentation PDF directly from the browser using `jsPDF` and HTML5 Canvas.
- **Markdown Blog Engine**: An integrated, lightweight journaling system using `marked.js` to parse `.md` files into clean HTML.
- **Fully Responsive**: Adapts seamlessly from desktop monitors down to mobile screens using pure CSS Flexbox and Grid.

## 🛠️ Technology Stack
- **HTML5** (Semantic structure & Accessibility)
- **CSS3** (Custom Properties, Flexbox, Grid, CSS Animations)
- **Vanilla JavaScript** (ES6+, Fetch API, Promises, Async/Await)
- **jsPDF & HTML5 Canvas** (Dynamic PDF rendering with base64 embedded images)
- **Marked.js** (Markdown parsing)

## 🚀 Getting Started

To view this project locally, simply clone the repository. Because the project uses the Javascript `fetch()` API to load JSON and Markdown data, **it must be run through a local web server** (opening the HTML file directly via `file://` will cause CORS errors).

```bash
# Clone the repository
git clone https://github.com/Bilgrandov/myPortfolio.git

# Navigate into the directory
cd myPortfolio

# Start a local server (Example using PHP, or you can use VSCode Live Server)
php -S localhost:8000
```
Then visit `http://localhost:8000` in your browser.

## 👨‍💻 About the Developer
I am **Bilgrandov**, a Fullstack Developer and Software Engineer currently on a self-driven training arc. I built this portfolio not just as a gallery, but as a technical playground to document my raw learning journey and solidify my foundational engineering skills.

---
*Made with ♡ & HTML*

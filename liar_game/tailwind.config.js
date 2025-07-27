/_ @type {import('tailwindcss').Config} _/
module.exports = {
content: ["./src/**/*.{js,jsx,ts,tsx}"],
theme: {
extend: {},
},
plugins: [require("@tailwindcss/line-clamp"), require("daisyui")],
};
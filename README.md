# Role-based AI Assistant

A customizable AI chatbot built with Next.js and Groq (Llama 3). 

This application allows users to dynamically assign a "role" to the AI (e.g., Math Teacher, Software Engineer, Fitness Coach). The AI will strictly adhere to that role and politely refuse to answer any questions that fall outside its assigned expertise.

## Features
- **Dynamic Roles**: Change the AI's behavior instantly by typing a new role.
- **Strict Guardrails**: Rejects off-topic questions automatically.
- **Multilingual Support**: Supports English, Hindi, and Tamil.
- **Voice Input**: Speak your questions directly to the bot.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Add your Groq API Key to `.env.local`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deploy easily to Vercel using the Vercel CLI:
```bash
npx vercel --prod
```
*Don't forget to add your `GROQ_API_KEY` to your Vercel Environment Variables!*
